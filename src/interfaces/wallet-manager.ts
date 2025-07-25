import type { CurvyWallet } from "@/wallet";

interface IWalletManager {
  get wallets(): Array<CurvyWallet>;

  get activeWallet(): CurvyWallet;

  getWalletById(id: string): CurvyWallet | undefined;

  setActiveWallet(wallet: CurvyWallet): Promise<void>;

  addWallet(wallet: CurvyWallet): Promise<void>;

  scanWallet(wallet: CurvyWallet): Promise<void>;

  scanOnce(): Promise<void>;

  startIntervalScan(interval?: number): void;

  stopIntervalScan(): void;
}

export type { IWalletManager };
