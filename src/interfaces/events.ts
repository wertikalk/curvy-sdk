import type {
  ScanCompleteEvent,
  ScanErrorEvent,
  ScanMatchEvent,
  ScanProgressEvent,
  SyncCompleteEvent,
  SyncErrorEvent,
  SyncProgressEvent,
  SyncStartedEvent,
} from "@/types/events";

interface ICurvyEventEmitter {
  emitSyncStarted(event: SyncStartedEvent): void;
  emitSyncProgress(event: SyncProgressEvent): void;
  emitSyncComplete(event: SyncCompleteEvent): void;
  emitSyncError(event: SyncErrorEvent): void;
  emitScanProgress(event: ScanProgressEvent): void;
  emitScanComplete(event: ScanCompleteEvent): void;
  emitScanMatch(event: ScanMatchEvent): void;
  emitScanError(event: ScanErrorEvent): void;
}

export type { ICurvyEventEmitter };
