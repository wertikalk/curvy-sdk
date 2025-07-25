import type {
  EVM_NETWORKS,
  NETWORK_FLAVOUR,
  NETWORK_FLAVOUR_VALUES,
  STARKNET_NETWORKS,
  TOKENS,
} from "@/constants/networks";
import type { ScannedAnnouncement } from "@/types";

// biome-ignore lint/suspicious/noExplicitAny: Need to allow any for generic type
type CurvyAddressBalances<T extends NETWORK_FLAVOUR_VALUES = any> = Record<
  T extends NETWORK_FLAVOUR["EVM"] ? EVM_NETWORKS : T extends NETWORK_FLAVOUR["STARKNET"] ? STARKNET_NETWORKS : string,
  Record<TOKENS, { balance: bigint; tokenAddress: string | undefined; decimals?: number }>
>;

type CurvyAddressBalance = {
  decimals: number;
  balance: bigint;
  tokenAddress: string | undefined;
};

// biome-ignore lint/suspicious/noExplicitAny: Need to allow any for generic type
interface CurvyAddress<T extends NETWORK_FLAVOUR_VALUES = any> extends ScannedAnnouncement {
  walletId: string;
  balances: CurvyAddressBalances<T>;
}
interface EVMCurvyAddress extends CurvyAddress<NETWORK_FLAVOUR["EVM"]> {}
interface StarknetCurvyAddress extends CurvyAddress<NETWORK_FLAVOUR["STARKNET"]> {}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
interface MinifiedCurvyAddress<T extends NETWORK_FLAVOUR_VALUES = any>
  extends Omit<CurvyAddress<T>, "ephemeralPublicKey" | "publicKey"> {
  ephemeralPublicKey: Uint8Array;
  publicKey: Uint8Array;
}

export type {
  CurvyAddress,
  CurvyAddressBalances,
  CurvyAddressBalance,
  MinifiedCurvyAddress,
  EVMCurvyAddress,
  StarknetCurvyAddress,
};
