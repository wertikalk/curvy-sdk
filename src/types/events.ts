import type { CurvyAddress } from "@/interfaces/address";
import type { RawAnnoucement } from "@/types/api";
import type { CurvyWallet } from "@/wallet";

//#region Sync events

type SyncStartedEvent = {
  total: number;
};

type SyncProgressEvent = {
  synced: number;
  announcements: RawAnnoucement[];
  remaining: number;
};

type SyncCompleteEvent = {
  totalSynced: number;
};

type SyncErrorEvent = {
  error: Error;
};

export type { SyncStartedEvent, SyncProgressEvent, SyncCompleteEvent, SyncErrorEvent };

//#endregion

//#region Scan events

type ScanMatchEvent = {
  wallet: CurvyWallet;
  stealthAddress: CurvyAddress;
};

type ScanProgressEvent = {
  scanned: number;
  wallet: CurvyWallet;
  total: number;
};

type ScanCompleteEvent = {
  scanned: number;
  matched: number;
  wallet: CurvyWallet;
  total: number;
};

type ScanErrorEvent = {
  wallet: CurvyWallet;
  error: Error;
};

export type { ScanMatchEvent, ScanProgressEvent, ScanCompleteEvent, ScanErrorEvent };

//#endregion
