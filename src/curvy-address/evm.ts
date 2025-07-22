import { type EVM_NETWORKS, NETWORK_FLAVOUR } from "@/constants/networks";
import { _CurvyAddress } from "@/curvy-address/abstract";
import type { CurvyAddressBalance, CurvyAddressBalances } from "@/curvy-address/interface";
import type { ScannedAnnouncement } from "@/types";
import type { Network } from "@/types/api";
import { networkGroupToSlug } from "@/utils/helpers";

class EVMCurvyAddress extends _CurvyAddress<NETWORK_FLAVOUR["EVM"]> {
  // biome-ignore lint/complexity/noUselessConstructor: <explanation>
  constructor(announcement: ScannedAnnouncement) {
    super(announcement);
  }

  setBalance(network: Network, { balance, tokenAddress, symbol }: CurvyAddressBalance): void {
    if (network.flavour !== NETWORK_FLAVOUR.EVM)
      throw new Error("Set balance called with an invalid network for EVM address");
    const networkSlug = networkGroupToSlug(network) as EVM_NETWORKS;

    this.balances[networkSlug][symbol] = { balance, tokenAddress };
  }

  setBalances(network: Network, balances: CurvyAddressBalances<NETWORK_FLAVOUR["EVM"]>): void {
    if (network.flavour !== NETWORK_FLAVOUR.EVM)
      throw new Error("Set balance called with an invalid network for EVM address");

    this.balances = balances;
  }
}

export { EVMCurvyAddress };
