import type { NETWORK_FLAVOUR } from "@/constants/networks";
import type { EVMCurvyAddress } from "@/curvy-address/evm";
import type { CurvyAddressBalances } from "@/curvy-address/interface";
import type { StarknetCurvyAddress } from "@/curvy-address/starknet";
import { type NetworkFilter, filterNetworks } from "@/utils/network";
import type RPC from "./abstract";

export default class MultiRPC {
  private rpcs: RPC[] = [];

  constructor(rpcs: RPC[]) {
    this.rpcs = rpcs;
  }

  public getBalances<SA extends EVMCurvyAddress | StarknetCurvyAddress>(
    stealthAddress: SA,
  ): Promise<
    CurvyAddressBalances<
      SA extends EVMCurvyAddress
        ? NETWORK_FLAVOUR["EVM"]
        : SA extends NETWORK_FLAVOUR["STARKNET"]
          ? NETWORK_FLAVOUR["STARKNET"]
          : never
    >
  > {
    const rpcs = this.rpcs.filter((rpc) => rpc.Network().flavour === stealthAddress.networkFlavour);
    return Promise.all(rpcs.map((rpc) => rpc.getBalances(stealthAddress))).then((results) => {
      return Object.assign(Object.create(null), ...results);
    });
  }

  public Network(networkFilter: NetworkFilter): RPC {
    const rpc = this.rpcs.filter((rpc) => {
      return filterNetworks([rpc.Network()], networkFilter).length;
    });

    if (rpc.length === 0) {
      throw new Error(`Expected exactly one, but no network found with filter ${networkFilter}`);
    }

    if (rpc.length > 1) {
      throw new Error(`Expected exactly one, but more than one network found with filter ${networkFilter}`);
    }

    return rpc[0];
  }
}
