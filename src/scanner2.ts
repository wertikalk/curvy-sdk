import type { APIClient } from "@/client/client";
import type { Core } from "@/core";
import type { CurvyEventEmitter } from "@/events";
import CurvyStealthAddress from "@/stealth-address";
import type { AnnouncementStorageInterface } from "@/storage/interface";
import type { RawAnnoucement } from "@/types/api";
import type { CurvyWallet } from "@/wallet";

const SYNC_POLL_INTERVAL = 60000; // 1 minute in milliseconds
const SYNC_BATCH_SIZE = 200;
const SCAN_BATCH_SIZE = 200;

class Scanner2 {
  private readonly storage: AnnouncementStorageInterface;
  private readonly client: APIClient;
  private readonly emitter: CurvyEventEmitter;
  private readonly core: Core;
  private readonly wallet: CurvyWallet;

  private isSyncing;
  private syncInterval: NodeJS.Timeout | null;

  constructor(
    wallet: CurvyWallet,
    storage: AnnouncementStorageInterface,
    client: APIClient,
    core: Core,
    emitter: CurvyEventEmitter,
  ) {
    this.wallet = wallet;
    this.storage = storage;
    this.client = client;
    this.emitter = emitter;
    this.core = core;

    this.isSyncing = false;
    this.syncInterval = null;
  }

  public async start(): Promise<void> {
    await this.sync();

    this.syncInterval = setInterval(this.sync, SYNC_POLL_INTERVAL);
  }

  public stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // SyncAnnouncements will fetch and store all announcements since a specific time
  // TODO: This is only public to allow testing
  public async sync(): Promise<void> {
    if (this.isSyncing) {
      return;
    }

    const { s, v } = this.wallet.GetKeyPairs();

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
        const response = await this.client.announcement.GetAnnouncements(startTime, endTime, SYNC_BATCH_SIZE);

        const scanResult = this.core.scan(s, v, response.announcements);

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

  public async Scan(announcements: RawAnnoucement[]) {
    let matched = 0;

    for (const wallet of wallets) {
      const keyPairs = wallet.GetKeyPairs();
      const scanResult = this.core.scan(keyPairs.s, keyPairs.v, chunkOfNewAnnouncements);

      for (let scanResultCursor = 0; scanResultCursor < scanResult.spendingPubKeys.length; scanResultCursor++) {
        if (scanResult.spendingPubKeys[scanResultCursor] !== "") {
          // We can assume that the spendingPrivKey isn't "" as well
          const stealthAddress = new CurvyStealthAddress(
            scanResult.spendingPrivKeys[scanResultCursor],
            scanResult.spendingPubKeys[scanResultCursor],
            chunkOfNewAnnouncements[scanResultCursor].network_id,
            chunkOfNewAnnouncements[scanResultCursor].networkFlavour,
          );

          wallet.AddStealthAddress(stealthAddress);

          matched++;

          this.emitter.emitScanMatch({
            wallet,
            stealthAddress,
          });
        }
      }

      // If last announcement then emit complete, otherwise progress
      if (announcementCursor + chunkSize >= announcements.length) {
        this.emitter.emitScanComplete({
          scanned: announcements.length,
          matched,
          wallet,
          total: announcements.length,
        });
      } else {
        this.emitter.emitScanProgress({
          scanned: announcements.length,
          wallet,
          total: announcements.length,
        });
      }
    }
  }
}
