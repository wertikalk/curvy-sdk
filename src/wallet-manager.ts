import type { APIClient } from "@/client/client";
import type { Core } from "@/core";
import type { CurvyEventEmitter, SyncProgressEvent } from "@/events";
import { SYNC_PROGRESS_EVENT } from "@/events";
import AnnouncementScanner from "@/scanner";
import type { AnnouncementStorageInterface } from "@/storage/interface";
import { AnnouncementSyncer } from "@/syncer";
import type { RawAnnoucement } from "@/types/api";
import type { CurvyWallet } from "@/wallet";

export class WalletManager {
  private wallets: Array<CurvyWallet>;
  private readonly scanner: AnnouncementScanner;
  private readonly syncer: AnnouncementSyncer;

  constructor(
    private client: APIClient,
    private emitter: CurvyEventEmitter,
    private storage: AnnouncementStorageInterface,
    private core: Core,
  ) {
    this.wallets = [];
    this.scanner = new AnnouncementScanner(this.storage, this.core, this.emitter);
    this.syncer = new AnnouncementSyncer(this.storage, this.client, this.emitter);

    this.emitter.on(SYNC_PROGRESS_EVENT, async (event: SyncProgressEvent) => {
      await this.scanner.Scan(this.wallets, event.announcements);
    });
  }

  public GetWallets(): CurvyWallet[] {
    return this.wallets;
  }

  public async AddWallet(wallet: CurvyWallet): Promise<void> {
    await this.scanner.AddWallet(wallet);
    this.wallets.push(wallet);
  }

  public async ScanWallet(wallet: CurvyWallet, announcements: RawAnnoucement[]): Promise<void> {
    await this.scanner.Scan([wallet], announcements);
  }

  public StartSync(): void {
    this.syncer.Start();
  }

  public async SyncOnce(): Promise<void> {
    await this.syncer.sync();
  }

  public GetScanner(): AnnouncementScanner {
    return this.scanner;
  }

  public GetSyncer(): AnnouncementSyncer {
    return this.syncer;
  }
}
