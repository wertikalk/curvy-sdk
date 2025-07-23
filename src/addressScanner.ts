import type { IAPIClient } from "@/client/interface";
import { NETWORK_FLAVOUR } from "@/constants/networks";
import type { Core } from "@/core";
import { EVMCurvyAddress } from "@/curvy-address/evm";
import type { CurvyAddress } from "@/curvy-address/interface";
import { StarknetCurvyAddress } from "@/curvy-address/starknet";
import type { CurvyEventEmitter } from "@/events";
import type { AnnouncementStorageInterface } from "@/storage/interface";
import type { RawAnnoucement } from "@/types/api";
import { deriveAddress } from "@/utils/deriveAddress";
import type { CurvyWallet } from "@/wallet";

const SYNC_BATCH_SIZE = 200;

class AddressScanner {
  private storage: AnnouncementStorageInterface;
  private client: IAPIClient;
  private core: Core;
  private emitter: CurvyEventEmitter;
  private isSyncing: boolean;

  constructor(storage: AnnouncementStorageInterface, core: Core, client: IAPIClient, emitter: CurvyEventEmitter) {
    this.storage = storage;
    this.core = core;
    this.client = client;
    this.emitter = emitter;
    this.isSyncing = false;
  }

  async scan(wallets: CurvyWallet[]): Promise<void> {
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
        const response = await this.client.announcement.GetAnnouncements(startTime, endTime, SYNC_BATCH_SIZE);

        if (syncJustStarted) {
          total = response.total;
          this.emitter.emitSyncStarted({
            total,
          });

          syncJustStarted = false;
        }

        await this.#scan(wallets, response.announcements);

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

  async #scan(wallets: CurvyWallet[], announcements: RawAnnoucement[]) {
    for (const wallet of wallets) {
      let matched = 0;

      const keyPairs = wallet.keyPairs;
      const { spendingPubKeys, spendingPrivKeys } = this.core.scan(keyPairs.s, keyPairs.v, announcements);

      for (const [index, publicKey] of spendingPubKeys.entries()) {
        if (publicKey === "") continue;
        const privateKey = spendingPrivKeys[index];

        const announcement = announcements[index];

        let stealthAddress: CurvyAddress;
        switch (announcement.networkFlavour) {
          case NETWORK_FLAVOUR.EVM: {
            stealthAddress = new EVMCurvyAddress({
              ...announcement,
              publicKey,
              privateKey,
              address: deriveAddress(publicKey, announcement.networkFlavour),
            });
            break;
          }
          case NETWORK_FLAVOUR.STARKNET: {
            stealthAddress = new StarknetCurvyAddress({
              ...announcement,
              publicKey,
              privateKey,
              address: deriveAddress(publicKey, announcement.networkFlavour),
            });
            break;
          }
          default: {
            throw new Error(`Unsupported network flavour: ${announcement.networkFlavour}`);
          }
        }

        wallet.addStealthAddress(stealthAddress);

        matched++;

        this.emitter.emitScanMatch({
          wallet,
          stealthAddress,
        });
      }

      this.emitter.emitScanProgress({
        scanned: announcements.length,
        wallet,
        total: announcements.length,
      });
    }
  }
}

export { AddressScanner };
