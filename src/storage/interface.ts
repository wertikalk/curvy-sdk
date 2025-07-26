import type { CurvyAddress } from "@/types/address";
import type { RawAnnoucement } from "@/types/api";
import type { CurvyWalletData, ScanInfo } from "@/types/wallet";
import type { CurvyWallet } from "@/wallet";

export type AnnouncementQuery = {
  startTime?: Date;
  endTime?: Date;
  size?: number;
  offset?: number;
  networkId?: number[];
};

export type AnnouncementQueryResult = {
  announcements: RawAnnoucement[];
  total: number;
  oldestTimestamp?: Date;
  latestTimestamp?: Date;
};

export interface StorageInterface {
  storeCurvyAddress(announcement: RawAnnoucement): Promise<void>;
  storeManyCurvyAddresses(announcements: RawAnnoucement[]): Promise<void>;

  updateCurvyAddress(id: string, changes: Partial<CurvyAddress>): Promise<void>;
  updateManyCurvyAddresses(updates: Array<{ id: string; changes: Partial<CurvyAddress> }>): Promise<void>;

  getCurvyAddressById(id: string): Promise<CurvyAddress>;
  getCurvyAddressByIdAndWalletId(addressId: string, walletId: string): Promise<CurvyAddress>;
  getCurvyAddressesByWalletId(walletId: string): Promise<CurvyAddress[]>;
  getAllCurvyAddresses(): Promise<CurvyAddress[]>;

  storeCurvyWallet(wallet: CurvyWallet): Promise<void>;
  updateCurvyWalletData(walletId: string, changes: Partial<CurvyWalletData>): Promise<void>;
  getCurvyWalletDataById(id: string): Promise<CurvyWalletData>;

  getLatestScanCursor(walletId: string): Promise<number | undefined>;
  getOldestScanCursor(walletId: string): Promise<number | undefined>;
  getScanInfo(walletId: string): Promise<ScanInfo>;
}
