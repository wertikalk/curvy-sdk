import { NETWORK_ENVIRONMENT, assertSupportedNetwork } from "@/constants/networks";
import type { Network } from "@/types/api";

const isNode = typeof process !== "undefined" && process.versions != null && process.versions.node != null;

const networkGroupToSlug = (network: Network) => {
  const group = network.group.toLowerCase();
  assertSupportedNetwork(group);

  return `${group}-${network.testnet ? NETWORK_ENVIRONMENT.TESTNET : NETWORK_ENVIRONMENT.MAINNET}`;
};

export { isNode, networkGroupToSlug };
