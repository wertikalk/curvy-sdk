import { AddressScanner } from "@/addressScanner";
import type { APIClient } from "@/client/client";
import type { Core } from "@/core";
import type { CurvyEventEmitter } from "@/events";
import type { AnnouncementStorageInterface } from "@/storage/interface";
import { signJwtNonce } from "@/utils/helpers";
import type { CurvyWallet } from "@/wallet";

const JWT_REFRESH_INTERVAL = 14 * (60 * 10 ** 3);

export class WalletManager {
  readonly #wallets: Map<string, CurvyWallet>;
  readonly #apiClient: APIClient;
  readonly #addressScanner: AddressScanner;
  #scanInterval: NodeJS.Timeout | null;

  activeWallet: CurvyWallet | null;

  constructor(client: APIClient, emitter: CurvyEventEmitter, storage: AnnouncementStorageInterface, core: Core) {
    this.#apiClient = client;
    this.#wallets = new Map<string, CurvyWallet>();
    this.#addressScanner = new AddressScanner(storage, core, client, emitter);

    this.#scanInterval = null;
    this.activeWallet = null;
  }

  get wallets() {
    return Array.from(this.#wallets.values());
  }

  public getWalletByHandle(curvyHandle: string): CurvyWallet | undefined {
    return this.#wallets.get(curvyHandle);
  }

  async setActiveWallet(wallet: CurvyWallet) {
    if (!this.#wallets.has(wallet.curvyHandle)) {
      throw new Error(`Wallet with curvyHandle ${wallet.curvyHandle} does not exist.`);
    }

    this.activeWallet = wallet;

    this.#apiClient.updateBearerToken(
      await this.#apiClient.auth.GetBearerTotp().then((nonce) => {
        return this.#apiClient.auth.CreateBearerToken({ nonce, signature: signJwtNonce(nonce, wallet.keyPairs.s) });
      }),
    );

    setInterval(
      () =>
        this.#apiClient.auth.RefreshBearerToken().then((token) => {
          this.#apiClient.updateBearerToken(token);
        }),
      JWT_REFRESH_INTERVAL,
    );
  }

  async addWallet(wallet: CurvyWallet): Promise<void> {
    this.#wallets.set(wallet.curvyHandle, wallet);

    if (!this.activeWallet) await this.setActiveWallet(wallet);

    if (!this.#scanInterval) {
      this.startIntervalScan();
    }
  }

  async scanWallet(wallet: CurvyWallet): Promise<void> {
    await this.#addressScanner.scan([wallet]);
  }

  async scanOnce(): Promise<void> {
    await this.#addressScanner.scan(Array.from(this.#wallets.values()));
  }

  startIntervalScan(): void {
    const walletArray = Array.from(this.#wallets.values());

    this.#addressScanner.scan(walletArray).then(() => {
      this.#scanInterval = setInterval(() => this.#addressScanner.scan(walletArray), 60000);
    });
  }

  stopIntervalScan(): void {
    if (!this.#scanInterval) {
      return;
    }

    clearInterval(this.#scanInterval);
  }
}
