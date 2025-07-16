import type { IAPIClient } from "./client/interface";
import type { CurvyEventEmitter } from "./events";
import type { AnnouncementStorageInterface } from "./storage/interface";

const SYNC_POLL_INTERVAL = 60000; // 1 minute in milliseconds
const SYNC_BATCH_SIZE = 200;

export class AnnouncementSyncer {
  private storage: AnnouncementStorageInterface;
  private client: IAPIClient;
  private emitter: CurvyEventEmitter;
  private isSyncing = false;

  constructor(storage: AnnouncementStorageInterface, client: IAPIClient, emitter: CurvyEventEmitter) {
    this.storage = storage;
    this.client = client;
    this.emitter = emitter;
  }

  public async Start(): Promise<void> {
    // Initial sync
    await this.sync();

    // Periodic sync
    setInterval(async () => {
      await this.sync();
    }, SYNC_POLL_INTERVAL);
  }

  // SyncAnnouncements will fetch and store all announcements since a specific time
  // TODO: This is only public to allow testing
  public async sync(): Promise<void> {
    if (this.isSyncing) {
      return;
    }

    this.isSyncing = true;

    let totalProcessed = 0;

    let syncJustStarted = true;

    try {
      // Process in batches
      let total = Number.POSITIVE_INFINITY; // We temporarily set the total to infinity until we know the total.

      const latestTimestampBeforeSync = await this.storage.GetLatestTimestamp();

      const initialSync = !latestTimestampBeforeSync;
      let startTime = latestTimestampBeforeSync;
      let endTime: Date | undefined;

      /**
       * if we are syncing for the first time, we want to get the announcements backwards
       * if we are syncing for subsequent times, we want to get the announcement forwards
       *
       * first time = get all, then get up to latest (DESC)
       * second time = get from latest, then get from latest (ASC)
       *
       */
      while (totalProcessed < total) {
        const response = await this.client.GetAnnouncements(startTime, endTime, SYNC_BATCH_SIZE);

        if (syncJustStarted) {
          total = response.total;
          this.emitter.emitSyncStarted({
            total,
          });

          syncJustStarted = false;
        }

        for (const announcement of response.announcements) {
          await this.storage.WriteAnnouncement(announcement);
        }

        totalProcessed += response.announcements.length;

        // Emit progress for each batch
        this.emitter.emitSyncProgress({
          synced: totalProcessed,
          announcements: response.announcements,
          remaining: total - totalProcessed,
        });

        if (initialSync) {
          endTime = await this.storage.GetEarliestTimestamp();
        } else {
          startTime = await this.storage.GetLatestTimestamp();
        }
      }

      // Emit progress for each batch
      this.emitter.emitSyncComplete({
        totalSynced: totalProcessed,
      });
    } catch (error) {
      this.emitter.emitSyncError({
        error: error as Error,
      });
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }
}
