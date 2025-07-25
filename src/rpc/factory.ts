import { NETWORK_FLAVOUR } from "@/constants/networks";
import { EvmRpc } from "@/rpc/evm";
import { StarknetRpc } from "@/rpc/starknet";
import type { Network } from "@/types/api";
import type { Rpc } from "./abstract";
import { MultiRpc } from "./multi";

export async function newRpc(network: Network) {
  let rpc: Rpc;

  switch (network.flavour) {
    case NETWORK_FLAVOUR.EVM:
      rpc = new EvmRpc(network);
      break;
    case NETWORK_FLAVOUR.STARKNET:
      rpc = new StarknetRpc(network);
      break;
    default:
      throw Error("Unknown network flavour");
  }

  return rpc;
}

export async function newMultiRpc(networks: Network[]) {
  const promises = networks.map(async (network) => {
    return await newRpc(network);
  });

  const rpcs = await Promise.all(promises);

  return new MultiRpc(rpcs);
}
