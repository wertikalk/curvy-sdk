import type { NetworkFlavour } from "@/types";
import type { Network } from "@/types/api";
import { deriveAddress } from "./utils/deriveAddress";
import { toSlug } from "./utils/slug";

export default class CurvyStealthAddress {
  privateKey: string;
  publicKey: string;
  address: string;
  flavour?: NetworkFlavour;
  networkId: number;

  // balances are mapped to specific currency names
  balances: Record<string, bigint>;

  public constructor(privateKey: string, publicKey: string, networkId: number, flavour: NetworkFlavour | undefined);
  public constructor();
  public constructor(privateKey?: string, publicKey?: string, networkId?: number, flavour?: NetworkFlavour) {
    this.privateKey = privateKey || "";
    this.publicKey = publicKey || "";
    this.balances = {};
    this.networkId = networkId || -1;
    this.flavour = flavour;
    this.address = deriveAddress(this.publicKey, flavour);
  }

  public static fromAddress(address: string): CurvyStealthAddress {
    const stealthAddress = new CurvyStealthAddress();

    stealthAddress.address = address;

    return stealthAddress;
  }

  public SetBalance(currency: string, balance: bigint): void {
    this.balances[currency] = balance;
  }

  public SetBalances(network: Network, balances: Record<string, bigint>): void {
    for (const currency in balances) {
      this.balances[`${toSlug(network.name)}:${currency}`] = balances[currency];
    }
  }
}
