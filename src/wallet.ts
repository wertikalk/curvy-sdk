import type { CurvyKeyPairs } from "@/types/core";
import type CurvyStealthAddress from "./stealth-address";

export class CurvyWallet {
  private readonly keyPairs: CurvyKeyPairs;
  // @ts-ignore
  private ownerAddress: string | undefined;
  // @ts-ignore
  private curvyHandle: string | undefined;

  public stealthAddresses: CurvyStealthAddress[] = [];

  constructor(curvyHandle: string | undefined, ownerAddress: string | undefined, keyPairs: CurvyKeyPairs) {
    this.curvyHandle = curvyHandle;
    this.ownerAddress = ownerAddress;
    this.keyPairs = keyPairs;
  }

  // TODO: Think if should be public or we need a Scan method
  public GetKeyPairs(): CurvyKeyPairs {
    return this.keyPairs;
  }

  public GetOwnerAddress(): string | undefined {
    return this.ownerAddress;
  }

  public GetCurvyHandle(): string | undefined {
    return this.curvyHandle;
  }

  public AddStealthAddress(stealthAddress: CurvyStealthAddress) {
    this.stealthAddresses.push(stealthAddress);
  }
}
