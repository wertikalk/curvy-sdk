import type { Network } from "@/types/api";
import type RPC from "./abstract";
import EVMRPC from "./evm";
import MultiRPC from "./multi";
import StarknetRPC from "./starknet";

export async function NewRPC(network: Network): Promise<RPC> {
  let rpc: RPC;

  switch (network.flavour) {
    case "evm":
      rpc = new EVMRPC(network);
      break;
    case "starknet":
      rpc = new StarknetRPC(network);
      break;
    default:
      throw Error("Unknown network flavour");
  }

  await rpc.init();

  return rpc;
}

export async function NewMultiRPC(networks: Network[]): Promise<MultiRPC> {
  const promises = networks.map(async (network) => {
    return await NewRPC(network);
  });

  const rpcs = await Promise.all(promises);

  return new MultiRPC(rpcs);
}
