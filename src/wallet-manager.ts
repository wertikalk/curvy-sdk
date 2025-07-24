import { AddressScanner } from "@/addressScanner";
import type { APIClient } from "@/client/client";
import type { Core } from "@/core";
import type { CurvyEventEmitter } from "@/events";
import type { StorageInterface } from "@/storage/interface";
import { signJwtNonce } from "@/utils/helpers";
import type { CurvyWallet } from "@/wallet";

const JWT_REFRESH_INTERVAL = 14 * (60 * 10 ** 3);

export class WalletManager {
  readonly #wallets: Map<string, CurvyWallet>;
  readonly #apiClient: APIClient;
  readonly #addressScanner: AddressScanner;
  #scanInterval: NodeJS.Timeout | null;
  readonly #storage: StorageInterface;

  activeWallet: CurvyWallet | null;

  constructor(client: APIClient, emitter: CurvyEventEmitter, storage: StorageInterface, core: Core) {
    this.#apiClient = client;
    this.#wallets = new Map<string, CurvyWallet>();
    this.#storage = storage;
    this.#addressScanner = new AddressScanner(storage, core, client, emitter);

    this.#scanInterval = null;
    this.activeWallet = null;
  }

  get wallets() {
    return Array.from(this.#wallets.values());
  }

  public getWalletById(id: string): CurvyWallet | undefined {
    return this.#wallets.get(id);
  }

  async setActiveWallet(wallet: CurvyWallet) {
    if (!this.#wallets.has(wallet.id)) {
      throw new Error(`Wallet with id ${wallet.id} does not exist.`);
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
    this.#wallets.set(wallet.id, wallet);

    if (!this.activeWallet) await this.setActiveWallet(wallet);

    await this.#storage.storeCurvyWallet(wallet);

    if (!this.#scanInterval) {
      this.startIntervalScan();
      return;
    }

    await this.scanWallet(wallet);
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
