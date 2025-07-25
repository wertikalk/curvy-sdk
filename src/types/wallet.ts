type ScanCursors = {
  latest: number | undefined;
  oldest: number | undefined;
};

type ScanInfo = {
  scanCursors: ScanCursors;
  oldestCutoff: number;
};

type CurvyWalletData = {
  readonly id: string;
  readonly createdAt: number;
  readonly ownerAddress: string;
  readonly curvyHandle: string;
  scanCursors: ScanCursors;
};

type SerializedCurvyWallet = {
  readonly id: string;
  readonly createdAt: number;
  readonly ownerAddress: string;
  readonly curvyHandle: string;
};

export type { CurvyWalletData, ScanCursors, ScanInfo, SerializedCurvyWallet };
