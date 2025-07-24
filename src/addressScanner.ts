import type { IAPIClient } from "@/client/interface";
import type { Core } from "@/core";
import type { CurvyAddress } from "@/curvy-address/interface";
import type { CurvyEventEmitter } from "@/events";
import type { StorageInterface } from "@/storage/interface";
import type { RawAnnoucement } from "@/types/api";
import { deriveAddress } from "@/utils/deriveAddress";
import type { CurvyWallet } from "@/wallet";
import dayjs from "dayjs";

const SYNC_BATCH_SIZE = 200;

class AddressScanner {
  private storage: StorageInterface;
  private client: IAPIClient;
  private core: Core;
  private emitter: CurvyEventEmitter;
  private isSyncing: boolean;

  constructor(storage: StorageInterface, core: Core, client: IAPIClient, emitter: CurvyEventEmitter) {
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

    for (const wallet of wallets) {
      let totalProcessed = 0;
      let syncJustStarted = true;

      try {
        // Process in batches
        let total = Number.POSITIVE_INFINITY; // We temporarily set the total to infinity until we know the total.

        const { oldest, latest } = await this.storage.getScanCursors(wallet.id);

        const initialSync = !latest;
        let startTime = latest;
        let endTime: number | undefined;

        /**
         * if we are syncing for the first time, we want to get the announcements backwards
         * if we are syncing for subsequent times, we want to get the announcement forwards
         *
         * first time = get all, then get up to latest (DESC)
         * second time = get from latest, then get from latest (ASC)
         *
         */
        while (totalProcessed < total) {
          const { announcements, total: respTotal } = await this.client.announcement.GetAnnouncements(
            startTime,
            endTime,
            SYNC_BATCH_SIZE,
          );

          const newOldest = Math.min(oldest ?? Number.POSITIVE_INFINITY, +dayjs(announcements.at(-1)?.createdAt));
          const newLatest = Math.max(latest ?? 0, +dayjs(announcements.at(0)?.createdAt));

          await this.storage.updateCurvyWalletData(wallet.id, {
            scanCursors: { latest: newLatest, oldest: newOldest },
          });

          if (syncJustStarted) {
            total = respTotal;
            this.emitter.emitSyncStarted({
              total,
            });
          }

          syncJustStarted = false;

          await this.#scan(wallet, announcements);

          totalProcessed += announcements.length;

          // Emit progress for each batch
          this.emitter.emitSyncProgress({
            synced: totalProcessed,
            announcements,
            remaining: total - totalProcessed,
          });

          if (initialSync) {
            endTime = await this.storage.getOldestScanCursor(wallet.id);
          } else {
            startTime = await this.storage.getLatestScanCursor(wallet.id);
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
  }

  async #scan(wallet: CurvyWallet, announcements: RawAnnoucement[]) {
    let matched = 0;

    const keyPairs = wallet.keyPairs;
    const { spendingPubKeys } = this.core.scan(keyPairs.s, keyPairs.v, announcements);

    const addresses = spendingPubKeys
      .map((publicKey, index) => {
        if (publicKey === "") return null;

        const announcement = announcements[index];
        const address = deriveAddress(publicKey, announcement.networkFlavour);

        return { ...announcement, publicKey, address, balances: {}, walletId: wallet.id } satisfies CurvyAddress;
      })
      .filter(Boolean);

    await this.storage.storeManyCurvyAddresses(addresses);

    matched++;

    this.emitter.emitScanProgress({
      scanned: matched,
      wallet,
      total: announcements.length,
    });
  }
}

export { AddressScanner };
