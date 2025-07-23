import type { Network, NetworkFlavour } from "./types";
import { deriveAddress } from "./utils/deriveAddress";
import { toSlug } from "./utils/slug";
import { CSUC } from "./types";
import { EVM } from "./utils/tokenHandling";

export default class CurvyStealthAddress {
    privateKey: string;
    publicKey: string;
    address: string;
    flavour?: NetworkFlavour;
    networkId: number;

    // balances are mapped to specific currency names
    balances: Record<string, bigint>;

    // CSUC balances and nonces (each token has its own nonce)
    csuc: {
        balances: Record<string, bigint>;
        nonces: Record<string, bigint>;
    };

    public constructor(
        privateKey: string,
        publicKey: string,
        networkId: number,
        flavour: NetworkFlavour | undefined
    );
    public constructor();
    public constructor(
        privateKey?: string,
        publicKey?: string,
        networkId?: number,
        flavour?: NetworkFlavour
    ) {
        this.privateKey = privateKey || "";
        this.publicKey = publicKey || "";
        this.balances = {};
        this.csuc = {
            balances: {},
            nonces: {},
        };
        this.networkId = networkId || -1;
        this.flavour = flavour;
        this.address = deriveAddress(this.publicKey, flavour);
    }

    public static fromAddress(address: string): CurvyStealthAddress {
        const stealthAddress = new CurvyStealthAddress();

        stealthAddress.address = address;

        return stealthAddress;
    }

    public SetBalance(currency: string, balance: bigint): void {
        this.balances[currency] = balance;
    }

    public SetBalances(
        network: Network,
        balances: Record<string, bigint>
    ): void {
        for (const currency in balances) {
            console.log(
                `Setting balance for ${currency} on network ${network.name}:`,
                balances[currency]
            );

            this.balances[`${toSlug(network.name)}:${currency}`] =
                balances[currency];
        }
    }

    public SetInfoCSUC(
        network: Network,
        balances: CSUC.Balance[],
        nonces: CSUC.Nonce[]
    ): void {
        for (const [idx, balance] of balances.entries()) {
            const amount = BigInt(balance.amount);
            if (amount === 0n) continue;

            const tokenSymbol = EVM.getTokenSymbol(
                toSlug(network.name),
                balance.token
            );
            console.log(
                `Setting CSUC balance for ${balance.token} on network ${network.name}:`,
                balance.amount,
                `tokenSymbol: ${tokenSymbol}`
            );
            this.csuc.balances[`${toSlug(network.name)}:${tokenSymbol}`] =
                amount;

            this.csuc.nonces[`${toSlug(network.name)}:${tokenSymbol}`] = BigInt(
                nonces[idx].value
            );
        }
    }
}
