import type { CurvyAddress } from "@/curvy-address/interface";
import type { RawAnnoucement } from "@/types/api";
import EventEmitter from "eventemitter3";
import type { CurvyWallet } from "./wallet";

// Syncing events
export type SyncStartedEvent = {
  total: number;
};

export type SyncProgressEvent = {
  synced: number;
  announcements: RawAnnoucement[];
  remaining: number;
};

export type SyncCompleteEvent = {
  totalSynced: number;
};

export type SyncErrorEvent = {
  error: Error;
};

export const SYNC_STARTED_EVENT = "sync-started";
export const SYNC_PROGRESS_EVENT = "sync-progress";
export const SYNC_COMPLETE_EVENT = "sync-complete";
export const SYNC_ERROR_EVENT = "sync-error";

// Scanning events

export type ScanProgressEvent = {
  scanned: number;
  wallet: CurvyWallet;
  total: number;
};

export type ScanCompleteEvent = {
  scanned: number;
  matched: number;
  wallet: CurvyWallet;
  total: number;
};

export type ScanMatchEvent = {
  wallet: CurvyWallet;
  stealthAddress: CurvyAddress;
};

export type ScanErrorEvent = {
  wallet: CurvyWallet;
  error: Error;
};

export const SCAN_PROGRESS_EVENT = "scan-progress";
export const SCAN_COMPLETE_EVENT = "scan-complete";
export const SCAN_MATCH_EVENT = "scan-match";
export const SCAN_ERROR_EVENT = "scan-error";

export class CurvyEventEmitter extends EventEmitter {
  emitSyncStarted(event: SyncStartedEvent) {
    this.emit(SYNC_STARTED_EVENT, event);
  }

  emitSyncProgress(event: SyncProgressEvent) {
    this.emit(SYNC_PROGRESS_EVENT, event);
  }

  emitSyncComplete(event: SyncCompleteEvent) {
    this.emit(SYNC_COMPLETE_EVENT, event);
  }

  emitSyncError(event: SyncErrorEvent) {
    this.emit(SYNC_ERROR_EVENT, event);
  }

  emitScanProgress(event: ScanProgressEvent) {
    this.emit(SCAN_PROGRESS_EVENT, event);
  }

  emitScanComplete(event: ScanCompleteEvent) {
    this.emit(SCAN_COMPLETE_EVENT, event);
  }

  emitScanMatch(event: ScanMatchEvent) {
    this.emit(SCAN_MATCH_EVENT, event);
  }

  emitScanError(event: ScanErrorEvent) {
    this.emit(SCAN_ERROR_EVENT, event);
  }
}
