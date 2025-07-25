import type { RawAnnoucement } from "@/types/api";
import type { CoreScanReturnType, CoreSendReturnType, CoreViewerScanReturnType, CurvyKeyPairs } from "@/types/core";

interface ICore {
  generateKeyPairs(): CurvyKeyPairs;
  getCurvyKeys(s: string, v: string): CurvyKeyPairs;
  send(S: string, V: string): CoreSendReturnType;
  scan(s: string, v: string, announcements: RawAnnoucement[]): CoreScanReturnType;
  viewerScan(v: string, S: string, announcements: RawAnnoucement[]): CoreViewerScanReturnType;
  isValidBN254Point(point: string): boolean;
  isValidSECP256k1Point(point: string): boolean;
  version(): string;
}

export type { ICore };
