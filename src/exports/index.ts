export { CurvySDK } from "../sdk";
export type { CurvyWallet } from "../wallet";

export { filterNetworks, type NetworkFilter } from "../utils/network";

// export * from "../types";
export * from "../errors";

export {
  SYNC_STARTED_EVENT,
  SYNC_ERROR_EVENT,
  SYNC_PROGRESS_EVENT,
  SCAN_PROGRESS_EVENT,
  SCAN_COMPLETE_EVENT,
  SCAN_ERROR_EVENT,
  SCAN_MATCH_EVENT,
  SYNC_COMPLETE_EVENT,
} from "@/constants/events";

export type {
  ScanErrorEvent,
  ScanMatchEvent,
  ScanCompleteEvent,
  ScanProgressEvent,
  SyncCompleteEvent,
  SyncErrorEvent,
  SyncStartedEvent,
  SyncProgressEvent,
} from "@/types/events";
