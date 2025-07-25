import type { CurvyKeyPairs } from "@/types/core";

export type ScanCursors = {
  latest: number | undefined;
  oldest: number | undefined;
};

export type ScanInfo = {
  scanCursors: ScanCursors;
  oldestCutoff: number;
};

interface CurvyWalletData {
  readonly id: string;
  readonly createdAt: number;
  readonly ownerAddress: string;
  readonly curvyHandle: string;
  scanCursors: ScanCursors;
}

class CurvyWallet {
  readonly id: string;
  readonly createdAt: number;
  readonly ownerAddress: string;
  readonly curvyHandle: string;

  readonly #keyPairs: CurvyKeyPairs;

  constructor(id: string, createdAt: number, curvyHandle: string, ownerAddress: string, keyPairs: CurvyKeyPairs) {
    this.id = id;
    this.createdAt = createdAt;
    this.curvyHandle = curvyHandle;
    this.ownerAddress = ownerAddress;
    this.#keyPairs = keyPairs;
  }

  get keyPairs() {
    return this.#keyPairs;
  }

  serialize() {
    return {
      id: this.id,
      createdAt: this.createdAt,
      ownerAddress: this.ownerAddress,
      curvyHandle: this.curvyHandle,
    };
  }
}

export { CurvyWallet, type CurvyWalletData };
