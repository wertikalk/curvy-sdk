import type { ExtractKeys, ExtractValues } from "@/types/helper";

const NETWORK_ENVIRONMENT = {
  MAINNET: "mainnet",
  TESTNET: "testnet",
} as const;

const NETWORK_FLAVOUR = {
  EVM: "evm",
  STARKNET: "starknet",
} as const;

const SUPPORTED_NETWORKS = {
  ETHEREUM: "ethereum",
  ARBITRUM: "arbitrum",
  STARKNET: "starknet",
} as const;

const NETWORK_GROUP = {
  ETHEREUM: "Ethereum",
  STARKNET: "Starknet",
  ARBITRUM: "Arbitrum",
} as const;

type NETWORK_ENVIRONMENT = typeof NETWORK_ENVIRONMENT;
type NETWORK_ENVIRONMENT_VALUES = ExtractValues<NETWORK_ENVIRONMENT>;
type NETWORK_ENVIRONMENT_KEYS = ExtractKeys<NETWORK_ENVIRONMENT>;

type NETWORK_FLAVOUR = typeof NETWORK_FLAVOUR;
type NETWORK_FLAVOUR_VALUES = ExtractValues<NETWORK_FLAVOUR>;

type SUPPORTED_NETWORKS = typeof SUPPORTED_NETWORKS;
type SUPPORTED_NETWORKS_VALUES = ExtractValues<SUPPORTED_NETWORKS>;
type SUPPORTED_NETWORKS_KEYS = ExtractKeys<SUPPORTED_NETWORKS>;
function assertSupportedNetwork(network: string): asserts network is SUPPORTED_NETWORKS_VALUES {
  if (!Object.values(SUPPORTED_NETWORKS).includes(network)) throw new Error(`Unsupported network: ${network}`);
}

type NETWORKS = `${SUPPORTED_NETWORKS_VALUES}-${NETWORK_ENVIRONMENT_VALUES}`;
type EVM_NETWORKS = `${Exclude<SUPPORTED_NETWORKS_VALUES, "starknet">}-${NETWORK_ENVIRONMENT_VALUES}`;
type STARKNET_NETWORKS = `${Extract<SUPPORTED_NETWORKS_VALUES, "starknet">}-${NETWORK_ENVIRONMENT_VALUES}`;

type NETWORK_GROUP = typeof NETWORK_GROUP;
type NETWORK_GROUP_VALUES = ExtractValues<NETWORK_GROUP>;

type TOKENS =
  | (string & {})
  | "ETH"
  | "USDC"
  | "USDT"
  | "CRV"
  | "DAI"
  | "GRT"
  | "LDO"
  | "LINK"
  | "LORDS"
  | "MKR"
  | "NSTR"
  | "PENDLE"
  | "STRK"
  | "SUSHI"
  | "UNI"
  | "USDS"
  | "WBTC"
  | "ZRO"
  | "AAVE"
  | "ARB"
  | "COMP"
  | "COW";

export type {
  NETWORK_ENVIRONMENT_VALUES,
  NETWORK_ENVIRONMENT_KEYS,
  SUPPORTED_NETWORKS_VALUES,
  SUPPORTED_NETWORKS_KEYS,
  NETWORKS,
  TOKENS,
  EVM_NETWORKS,
  STARKNET_NETWORKS,
  NETWORK_FLAVOUR_VALUES,
  NETWORK_GROUP_VALUES,
};

export { NETWORK_ENVIRONMENT, SUPPORTED_NETWORKS, assertSupportedNetwork, NETWORK_FLAVOUR, NETWORK_GROUP };
