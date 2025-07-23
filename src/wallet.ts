import type { CurvyAddress } from "@/curvy-address/interface";
import type { CurvyKeyPairs } from "@/types/core";

export class CurvyWallet {
  readonly #keyPairs: CurvyKeyPairs;
  readonly ownerAddress: string;
  readonly curvyHandle: string;

  stealthAddresses: CurvyAddress[] = [];

  constructor(curvyHandle: string, ownerAddress: string, keyPairs: CurvyKeyPairs) {
    this.curvyHandle = curvyHandle;
    this.ownerAddress = ownerAddress;
    this.#keyPairs = keyPairs;
  }

  get keyPairs() {
    return this.#keyPairs;
  }

  addStealthAddress(stealthAddress: CurvyAddress) {
    this.stealthAddresses.push(stealthAddress);
  }
}
