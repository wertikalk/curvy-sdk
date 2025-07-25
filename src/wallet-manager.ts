import { AddressScanner } from "@/address-scanner";
import type { Core } from "@/core";
import type { CurvyEventEmitter } from "@/events";
import type { ApiClient } from "@/http/api";
import type { IWalletManager } from "@/interfaces/wallet-manager";
import type { StorageInterface } from "@/storage/interface";
import { signJwtNonce } from "@/utils/helpers";
import type { CurvyWallet } from "@/wallet";

const JWT_REFRESH_INTERVAL = 14 * (60 * 10 ** 3);
const SCAN_REFRESH_INTERVAL = 60 * 10 ** 3;

class WalletManager implements IWalletManager {
  readonly #wallets: Map<string, CurvyWallet>;
  readonly #apiClient: ApiClient;
  readonly #addressScanner: AddressScanner;
  readonly #storage: StorageInterface;

  #scanInterval: NodeJS.Timeout | null;
  #activeWallet: CurvyWallet | null;

  constructor(client: ApiClient, emitter: CurvyEventEmitter, storage: StorageInterface, core: Core) {
    this.#apiClient = client;
    this.#wallets = new Map<string, CurvyWallet>();
    this.#storage = storage;
    this.#addressScanner = new AddressScanner(storage, core, client, emitter);

    this.#scanInterval = null;
    this.#activeWallet = null;
  }

  get wallets() {
    return Array.from(this.#wallets.values());
  }

  get activeWallet() {
    if (!this.#activeWallet) {
      throw new Error("No active wallet set.");
    }
    return this.#activeWallet;
  }

  public getWalletById(id: string): CurvyWallet | undefined {
    return this.#wallets.get(id);
  }

  async setActiveWallet(wallet: CurvyWallet) {
    if (!this.#wallets.has(wallet.id)) {
      throw new Error(`Wallet with id ${wallet.id} does not exist.`);
    }

    this.#activeWallet = wallet;

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

    if (!this.#activeWallet) await this.setActiveWallet(wallet);

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

  /*
    TODO
        Should we allow scanning of all wallets at once, or should we only scan the active wallet?
        If we allow scanning of all wallets, we should consider how we approach request auth verification,
        as currently the bearer token is set to the active wallet's token.
  */

  /*
   * Starts an interval scan for all wallets.
   * @param interval - The interval in milliseconds to scan wallets. Default is 60 seconds.
   */
  startIntervalScan(interval = SCAN_REFRESH_INTERVAL): void {
    this.#addressScanner.scan(this.wallets).then(() => {
      this.#scanInterval = setInterval(() => this.#addressScanner.scan(this.wallets), interval);
    });
  }

  stopIntervalScan(): void {
    if (!this.#scanInterval) {
      return;
    }

    clearInterval(this.#scanInterval);
  }
}

export { WalletManager };
