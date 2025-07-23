import { parseEther } from "viem";
import { CSUC } from "../constants/evm";

export namespace EVM {
    export const parseDecimals = (
        value: string | number,
        decimals: number = 18 // Some tokens do not have 18 decimals!
    ): bigint => {
        if (typeof value === "number") {
            value = value.toString();
        }

        if (decimals === 18) {
            // Treat it same as Ether
            return parseEther(value);
        }

        // Rearrange the decimal point
        const parsedValue = parseEther(value);

        if (decimals < 18) {
            const factor = 10n ** BigInt(18 - decimals);

            return parsedValue / factor;
        }

        const factor = 10n ** BigInt(decimals - 18);
        return parsedValue * factor;
    };

    export const getTokenAddress = (
        networkId: string,
        tokenSymbol: string
    ): string | undefined => {
        if (networkId !== "ethereum-sepolia") {
            return undefined;
        }
        return CSUC.EnabledTokens[networkId].find(
            (token) => token.symbol === tokenSymbol
        )?.address;
    };

    export const getTokenSymbol = (
        networkId: string,
        tokenAddress: string
    ): string | undefined => {
        if (networkId !== "ethereum-sepolia") {
            return undefined;
        }
        return CSUC.EnabledTokens[networkId].find(
            (token) =>
                token.address.toLowerCase() === tokenAddress.toLowerCase()
        )?.symbol;
    };
}
