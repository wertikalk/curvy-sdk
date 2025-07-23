import type {
  EVM_NETWORKS,
  NETWORKS,
  NETWORK_FLAVOUR,
  NETWORK_FLAVOUR_VALUES,
  STARKNET_NETWORKS,
  TOKENS,
} from "@/constants/networks";
import type { ScannedAnnouncement } from "@/types";
import type { Network } from "@/types/api";

// biome-ignore lint/suspicious/noExplicitAny: Need to allow any for generic type
type CurvyAddressBalances<T extends NETWORK_FLAVOUR_VALUES = any> = Record<
  T extends NETWORK_FLAVOUR["EVM"] ? EVM_NETWORKS : T extends NETWORK_FLAVOUR["STARKNET"] ? STARKNET_NETWORKS : string,
  Record<TOKENS, { balance: bigint; tokenAddress: string | undefined }>
>;

type CurvyAddressBalance = {
  symbol: string;
  balance: bigint;
  tokenAddress: string | undefined;
};

// biome-ignore lint/suspicious/noExplicitAny: Need to allow any for generic type
interface CurvyAddress<T extends NETWORK_FLAVOUR_VALUES = any> extends ScannedAnnouncement {
  balances: CurvyAddressBalances<T>;

  setBalance: (network: Network, data: { symbol: string; balance: bigint; tokenAddress: string | undefined }) => void;

  setBalances: (
    network: Network,
    balances: Record<NETWORKS, Record<TOKENS, { balance: bigint; tokenAddress: string | undefined }>>,
  ) => void;
}

export type { CurvyAddress, CurvyAddressBalances, CurvyAddressBalance };
