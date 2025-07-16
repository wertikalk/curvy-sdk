import type CurvyStealthAddress from "../stealth-address";
import { type NetworkFilter, filterNetworks } from "../utils/network";
import type RPC from "./abstract";

export default class MultiRPC {
  private rpcs: RPC[] = [];

  constructor(rpcs: RPC[]) {
    this.rpcs = rpcs;
  }

  public GetBalances(stealthAddress: CurvyStealthAddress): Promise<Record<string, bigint>> {
    // TODO needs better handling for cases where sa is on mainnet and testnet is selected and vice versa
    const rpc = this.rpcs.find((rpc) => rpc.Network().id === stealthAddress.networkId);

    if (!rpc) {
      if (stealthAddress.networkId === -1)
        throw new Error(`There is no adequate RPC for stealth address with network ID ${stealthAddress.networkId}`);
    }

    return rpc?.GetBalances(stealthAddress) || Promise.resolve({});
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
