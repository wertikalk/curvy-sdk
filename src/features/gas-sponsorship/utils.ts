import { ethers } from "ethers";
import { parseEther, encodeAbiParameters, keccak256 } from "viem";

import CurvyStealthAddress from "../../stealth-address";

import { Types } from "./types";
import { CSUC as Constants } from "../../constants/evm";

export namespace Utils {
    export const PrepareActionRequest = async (
        network: Types.SupportedNetwork,
        from: CurvyStealthAddress,
        payload: Types.ActionPayload,
        totalFee: string
    ): Promise<Types.Action> => {
        assertNetworkIsSupported(network);

        // console.log("sdk: csuc sign:::Private key:", from.privateKey);
        const chainId = supportedNetworkToChainId(network);

        const { token } = JSON.parse(payload.encodedData);
        const tokenSymbol = EVM.Token.getTokenSymbol(network, token);
        if (!tokenSymbol) {
            throw new Error(`Token ${token} not found on network ${network}`);
        }
        const nonce = from.CSUC.getNonce(network, tokenSymbol);

        // console.log(
        //     "sdk: RequestActionInsideCSUC with payload:",
        //     payload,
        //     "totalFee:",
        //     totalFee,
        //     "nonce:",
        //     nonce,
        //     "fromPk:",
        //     from.privateKey
        // );

        console.log("sdk: RequestActionInsideCSUC with nonce:", nonce);

        const signature = await EVM.signActionPayload(
            chainId,
            payload,
            totalFee,
            nonce.toString(),
            from.privateKey as any
        );

        // console.log("sdk: RequestActionInsideCSUC signature:", signature);

        const action: Types.Action = {
            payload,
            totalFee,
            signature,
        };

        // console.log("sdk: RequestActionInsideCSUC action:", action);

        return action;
    };

    export const assertNetworkIsSupported = async (
        network: Types.SupportedNetwork
    ) => {
        if (network !== Types.SupportedNetwork.ETHEREUM_SEPOLIA) {
            throw new Error(
                `CSUC:EVM - Unsupported network for action type conversion!`
            );
        }
    };

    export const supportedNetworkToChainId = (
        network: Types.SupportedNetwork
    ): Types.SupportedNetworkChainId => {
        switch (network) {
            case Types.SupportedNetwork.ETHEREUM_SEPOLIA:
                return Types.SupportedNetworkChainId.ETHEREUM_SEPOLIA;
            default:
                throw new Error(
                    `Unsupported network: ${network}. Supported networks: ${Object.values(
                        Types.SupportedNetwork
                    ).join(", ")}`
                );
        }
    };

    export namespace EVM {
        // Needs to produce the same value as the one in the CSUC contract
        export const hashActionPayload = (
            chainId: string,
            payload: Types.ActionPayload,
            totalFee: string,
            nonce: string
        ): string => {
            assertNetworkIsSupported(payload.network);

            const actionId = getOnchainActionId(payload);
            const { token, amount, parameters } = JSON.parse(
                payload.encodedData
            );

            const viemValues = [
                BigInt(chainId),
                {
                    token,
                    actionId,
                    amount,
                    totalFee: BigInt(totalFee),
                    limit: 10_000_000_000n, // TODO: check with contract requirements
                    parameters: parameters || "0x",
                },
                BigInt(nonce),
            ];

            const encodedData = encodeAbiParameters(
                [
                    {
                        name: "_chainId",
                        type: "uint256",
                    },
                    {
                        name: "payload",
                        type: "tuple",
                        internalType: "struct CSUC_Types.ActionPayload",
                        components: [
                            {
                                name: "token",
                                type: "address",
                                internalType: "address",
                            },
                            {
                                name: "actionId",
                                type: "uint256",
                                internalType: "uint256",
                            },
                            {
                                name: "amount",
                                type: "uint256",
                                internalType: "uint256",
                            },
                            {
                                name: "totalFee",
                                type: "uint256",
                                internalType: "uint256",
                            },
                            {
                                name: "limit",
                                type: "uint256",
                                internalType: "uint256",
                            },
                            {
                                name: "parameters",
                                type: "bytes",
                                internalType: "bytes",
                            },
                        ],
                    },
                    {
                        name: "_nonce",
                        type: "uint256",
                    },
                ],
                viemValues as any
            );

            // // TODO: remove ethers' version...
            // const abiCoder = new ethers.AbiCoder();
            // const values = [
            //     chainId,
            //     [
            //         token,
            //         actionId,
            //         amount,
            //         totalFee,
            //         10_000_000_000, // TODO: check with contract requirements
            //         parameters || "0x",
            //     ],
            //     nonce,
            // ];
            // const ethersEncodedData = abiCoder.encode(
            //     [
            //         "uint256",
            //         // Payload is a struct with the following fields:
            //         "tuple(address,uint256,uint256,uint256,uint256,bytes)",
            //         "uint256",
            //     ],
            //     values
            // );
            // console.log(
            //     "Encoded data:",
            //     encodedData,
            //     "ETHERS:",
            //     ethersEncodedData
            // );

            const message = keccak256(encodedData);

            return message;
        };

        // Convert CSUC.ActionType to a hash representation for the contract
        export const getOnchainActionId = (
            payload: Types.ActionPayload
        ): bigint => {
            assertNetworkIsSupported(payload.network);

            const hash = (id: string) => {
                const encoded = encodeAbiParameters([{ type: "string" }], [id]);

                return BigInt(keccak256(encoded));
            };

            const at = payload.actionType as Types.ActionType;

            if (at.type === "transfer") {
                return hash("CSUC_TRANSFER_ACTION_ID");
            }
            if (at.type === "withdraw") {
                return hash("CSUC_WITHDRAWAL_ACTION_ID");
            }
            if (at.type === "deposit-to-aggregator") {
                return hash("AGGREGATOR_ACTION_HANDLER");
            }
            throw new Error(
                `CSUC:EVM:signActionPayload - Unsupported CSUC action type for conversion!`
            );
        };

        export const signActionPayload = async (
            chainId: string,
            payload: Types.ActionPayload,
            totalFee: string,
            nonce: string,
            privateKey: `0x${string}`
        ): Promise<Types.Signature> => {
            if (payload.network !== Types.SupportedNetwork.ETHEREUM_SEPOLIA) {
                throw new Error("Unsupported network for signing action");
            }

            const rawMessage = hashActionPayload(
                chainId,
                payload,
                totalFee,
                nonce
            );

            // Viem doesn't create signature correctly!
            //---------------------------------------------------
            // const account = privateKeyToAccount(privateKey);
            // const signatureHex = await account.signMessage({
            //     raw: rawMessage,
            // });
            // const { r, s, v } = parseSignature(signatureHex);

            // Ethers used insted
            // ---------------------------------------------------
            const account = new ethers.Wallet(privateKey);
            const signatureHex = account.signingKey.sign(rawMessage);
            const { r, s, v } = ethers.Signature.from(signatureHex);

            // Double check if the signature was generated correctly
            const recoveredAddress: string = ethers.computeAddress(
                ethers.SigningKey.recoverPublicKey(rawMessage, { r, s, v })
            );
            const expectedAddress: string = await account.getAddress();

            if (
                recoveredAddress.toLowerCase() !== expectedAddress.toLowerCase()
            ) {
                throw new Error(
                    `CSUC:EVM:signActionPayload - bad signature generated!`
                );
            }

            return {
                curve: "secp256k1",
                hash: rawMessage,
                r: r.toString(),
                s: s.toString(),
                v: BigInt(v).toString(),
            } as Types.Signature;
        };

        export namespace Token {
            export const parseDecimals = (
                value: bigint | string | number,
                decimals: number = 18 // Some tokens do not have 18 decimals!
            ): bigint => {
                if (typeof value === "number") {
                    value = value.toString();
                } else if (typeof value === "bigint") {
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
                return Constants.EnabledTokens[networkId].find(
                    (token) => token.symbol === tokenSymbol
                )?.address;
            };

            export const getTokenSymbol = (
                network: Types.SupportedNetwork,
                tokenAddress: string
            ): string | undefined => {
                if (network !== Types.SupportedNetwork.ETHEREUM_SEPOLIA) {
                    return undefined;
                }
                return Constants.EnabledTokens[network].find(
                    (token) =>
                        token.address.toLowerCase() ===
                        tokenAddress.toLowerCase()
                )?.symbol;
            };
        }
    }
}
