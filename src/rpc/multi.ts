import type CurvyStealthAddress from "../stealth-address";
import { type NetworkFilter, filterNetworks } from "../utils/network";
import type RPC from "./abstract";

export default class MultiRPC {
  private rpcs: RPC[] = [];

  constructor(rpcs: RPC[]) {
    this.rpcs = rpcs;
  }

  public GetBalances(stealthAddress: CurvyStealthAddress): Promise<Record<string, bigint>> {
    return Promise.all(this.rpcs.map((rpc) => rpc.GetBalances(stealthAddress))).then((results) => {
      const combinedBalance: Record<string, bigint> = {};

      for (const result of results) {
        if (!result) {
          continue;
        }

        for (const [key, value] of Object.entries(result)) {
          combinedBalance[key] = (combinedBalance[key] || BigInt(0)) + value;
        }
      }

      return combinedBalance;
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
