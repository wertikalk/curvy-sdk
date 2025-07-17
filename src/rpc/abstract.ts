import type { Address } from "viem";
import type CurvyStealthAddress from "../stealth-address";
import type { Network } from "../types";
import type { StarknetFeeEstimate } from "./starknet";

export default abstract class RPC {
  protected network: Network;

  constructor(network: Network) {
    this.network = network;
    this.init();
  }

  public Network(): Network {
    return this.network;
  }

  abstract init(): void;

  abstract GetBalances(stealthAddress: CurvyStealthAddress): Promise<Record<string, bigint>>;

  abstract SendToAddress(
    stealthAddress: CurvyStealthAddress,
    address: string,
    amount: string,
    currency: string,
    fee?: StarknetFeeEstimate | bigint,
  ): Promise<string>;

  abstract EstimateFee(
    stealthAddress: CurvyStealthAddress,
    address: Address,
    amount: string,
    currency: string,
  ): Promise<bigint | StarknetFeeEstimate>;

  abstract FeeToAmount(feeEstimate: StarknetFeeEstimate | bigint): bigint;
}
