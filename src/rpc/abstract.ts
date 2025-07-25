import type { Address } from "viem";
import type CurvyStealthAddress from "../stealth-address";
import type { Network } from "../types";

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

    abstract GetBalances(
        stealthAddress: CurvyStealthAddress
    ): Promise<Record<string, bigint>>;

    abstract SendToAddress(
        stealthAddress: CurvyStealthAddress,
        address: string,
        amount: string,
        currency: string,
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        fee?: any
    ): Promise<string>;

    abstract EstimateFee(
        stealthAddress: CurvyStealthAddress,
        address: Address,
        amount: string,
        currency: string
    ): // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    Promise<any>;

    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    abstract FeeToAmount(feeEstimate: any): bigint;

    abstract CreateReferenceToERC20(token: Address): Promise<any>;

    abstract CreateReferenceToCSUC(): Promise<any>;
}
