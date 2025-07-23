import { NETWORK_FLAVOUR, type STARKNET_NETWORKS } from "@/constants/networks";
import { _CurvyAddress } from "@/curvy-address/abstract";
import type { CurvyAddressBalance, CurvyAddressBalances } from "@/curvy-address/interface";
import type { ScannedAnnouncement } from "@/types";
import type { Network } from "@/types/api";
import { networkGroupToSlug } from "@/utils/helpers";

class StarknetCurvyAddress extends _CurvyAddress<NETWORK_FLAVOUR["STARKNET"]> {
  // biome-ignore lint/complexity/noUselessConstructor: Constructor is needed to initialize the base class with the scanned announcement
  constructor(announcement: ScannedAnnouncement) {
    super(announcement);
  }

  setBalance(network: Network, { balance, tokenAddress, symbol }: CurvyAddressBalance): void {
    if (network.flavour !== NETWORK_FLAVOUR.STARKNET)
      throw new Error("Set balance called with an invalid network for Starknet address");
    const networkSlug = networkGroupToSlug(network) as STARKNET_NETWORKS;

    this.balances[networkSlug][symbol] = { balance, tokenAddress };
  }

  setBalances(network: Network, balances: CurvyAddressBalances<NETWORK_FLAVOUR["STARKNET"]>): void {
    if (network.flavour !== NETWORK_FLAVOUR.STARKNET)
      throw new Error("Set balance called with an invalid network for Starknet address");

    this.balances = balances;
  }
}

export { StarknetCurvyAddress };
