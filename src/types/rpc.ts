import type { EstimateFee } from "starknet";

type StarknetFeeEstimate = {
  deployFee: EstimateFee | undefined;
  transactionFee: EstimateFee;
};

export type { StarknetFeeEstimate };
