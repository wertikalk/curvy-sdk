import type { CurvyAddress, CurvyAddressBalances } from "@/curvy-address/interface";
import type { Network } from "@/types/api";
import type { Address } from "viem";
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

  abstract getBalances(stealthAddress: CurvyAddress): Promise<CurvyAddressBalances>;

  abstract getBalance(stealthAddress: CurvyAddress, symbol: string): Promise<bigint>;

  abstract SendToAddress(
    stealthAddress: CurvyAddress,
    address: string,
    amount: string,
    currency: string,
    fee?: StarknetFeeEstimate | bigint,
  ): Promise<string>;

  abstract EstimateFee(
    stealthAddress: CurvyAddress,
    address: Address,
    amount: string,
    currency: string,
  ): Promise<bigint | StarknetFeeEstimate>;

  abstract FeeToAmount(feeEstimate: StarknetFeeEstimate | bigint): bigint;
}
