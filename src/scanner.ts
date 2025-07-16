import type { Core } from "./core/core";
import type { CurvyEventEmitter } from "./events";
import CurvyStealthAddress from "./stealth-address";
import type { AnnouncementStorageInterface } from "./storage/interface";
import type { Announcement } from "./types";
import type { CurvyWallet } from "./wallet";

export default class AnnouncementScanner {
  private announcementStorage: AnnouncementStorageInterface;
  private core: Core;
  private emitter: CurvyEventEmitter;
  public wallets: CurvyWallet[] = [];

  constructor(announcementStorage: AnnouncementStorageInterface, core: Core, emitter: CurvyEventEmitter) {
    this.announcementStorage = announcementStorage;
    this.core = core;
    this.emitter = emitter;
  }

  public GetWallets(): CurvyWallet[] {
    return this.wallets;
  }

  public async Scan(wallets: CurvyWallet[], announcements: Announcement[]) {
    const chunkSize = 250;
    let matched = 0;
    for (let announcementCursor = 0; announcementCursor < announcements.length; announcementCursor += chunkSize) {
      const chunkOfNewAnnouncements = announcements.slice(announcementCursor, announcementCursor + chunkSize);

      for (const wallet of wallets) {
        const keyPairs = wallet.GetKeyPairs();
        const scanResult = this.core.scan(keyPairs.s, keyPairs.v, chunkOfNewAnnouncements);

        for (let scanResultCursor = 0; scanResultCursor < scanResult.spendingPubKeys.length; scanResultCursor++) {
          if (scanResult.spendingPubKeys[scanResultCursor] !== "") {
            // We can assume that the spendingPrivKey isn't "" as well
            const stealthAddress = new CurvyStealthAddress(
              scanResult.spendingPrivKeys[scanResultCursor],
              scanResult.spendingPubKeys[scanResultCursor],
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

  public async AddWallet(wallet: CurvyWallet) {
    // Get all announcements
    let { announcements } = await this.announcementStorage.GetAnnouncements();
    let offset = 0;

    while (announcements.length > 0) {
      offset += announcements.length;
      // Scan all announcements

      await this.Scan([wallet], announcements);
      announcements = (await this.announcementStorage.GetAnnouncements({ offset })).announcements;
    }

    // Add the wallet to scanner.
    this.wallets.push(wallet);
  }
}
