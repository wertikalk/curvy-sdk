type CoreLegacyKeyPairs = {
  k: string;
  v: string;
  K: string;
  V: string;
};

type CurvyPrivateKeys = {
  s: string;
  v: string;
};
type CurvyPublicKeys = {
  S: string;
  V: string;
};
type CurvyKeyPairs = CurvyPrivateKeys & CurvyPublicKeys;

type CoreSendReturnType = {
  r: string;
  R: string;
  viewTag: string;
  spendingPubKey: string;
};

type CoreScanArgs = {
  k: string;
  v: string;
  Rs: Array<string>;
  viewTags: Array<string>;
};
type CoreScanReturnType = {
  spendingPubKeys: Array<string>;
  spendingPrivKeys: Array<string>;
};

type CoreViewerScanArgs = {
  v: string;
  K: string;
  Rs: Array<string>;
  viewTags: Array<string>;
};
type CoreViewerScanReturnType = {
  spendingPubKeys: Array<string>;
};

export type {
  CurvyKeyPairs,
  CurvyPublicKeys,
  CoreLegacyKeyPairs,
  CurvyPrivateKeys,
  CoreSendReturnType,
  CoreScanArgs,
  CoreScanReturnType,
  CoreViewerScanArgs,
  CoreViewerScanReturnType,
};
