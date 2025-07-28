import { Types, Utils } from "./csuc";
import { Network } from "../types";
import { toSlug } from ".././utils";

export class CSUC {
    balances: Record<string, bigint> = {};
    nonces: Record<string, bigint> = {};

    public SetCSAInfo(
        network: Network,
        balances: Types.Balance[],
        nonces: Types.Nonce[]
    ): void {
        for (const [idx, balance] of balances.entries()) {
            const amount = BigInt(balance.amount);
            if (amount === 0n) continue;

            const tokenSymbol = Utils.EVM.Token.getTokenSymbol(
                toSlug(network.name) as Types.SupportedNetwork,
                balance.token
            );

            this.balances[`${toSlug(network.name)}:${tokenSymbol}`] = amount;
            this.nonces[`${toSlug(network.name)}:${tokenSymbol}`] = BigInt(
                nonces[idx].value
            );
        }
    }

    public getNonce(
        network: Types.SupportedNetwork,
        tokenSymbol: string
    ): bigint {
        const key = `${network}:${tokenSymbol}`;

        if (!(key in this.nonces)) {
            throw new Error(
                `Getting nonce for key:'${key}' failed: Nonce not found!`
            );
        }
        return this.nonces[key];
    }
}
