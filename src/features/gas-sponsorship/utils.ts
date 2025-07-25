import {
    Address,
    createWalletClient,
    encodeFunctionData,
    erc20Abi,
    http,
    TransactionRequest,
    TransactionSerializable,
    parseTransaction,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import CurvyStealthAddress from "../../stealth-address";
import { Types } from "./types";
import EVMRPC from "../../rpc/evm";
import { jsonStringify } from "../../utils/common";

import { CSUC } from "../../constants/evm";
import { ARTIFACT as CSUC_ETH_SEPOLIA_ARTIFACT } from "../../contracts/evm/curvy-artifacts/ethereum-sepolia/CSUC";

export namespace Utils {
    export const PrepareTransferIntoCSUC = async (
        rpc: EVMRPC,
        from: CurvyStealthAddress,
        to: string,
        token: string,
        amount: bigint
    ): Promise<Types.Action> => {
        // Legacy CSA
        const account = privateKeyToAccount(from.privateKey as `0x${string}`);

        const { Main: MainCSUC } = CSUC.DeploymentAddresses[
            "ethereum-sepolia"
        ] as any;

        let nonce = await rpc.publicClient.getTransactionCount({
            address: account.address,
        });

        const accountClient = createWalletClient({
            account,
            chain: rpc.chain,
            transport: http(rpc.rpcUrl),
        });

        const txInfo = [
            // ERC20 approve transaction
            {
                to: token as Address,
                data: encodeFunctionData({
                    abi: erc20Abi,
                    functionName: "approve",
                    args: [MainCSUC, amount],
                }),
                gas: 70_000n,
                nonce,
            },
            // CSUC wrap transaction
            {
                to: MainCSUC as Address,
                data: encodeFunctionData({
                    abi: CSUC_ETH_SEPOLIA_ARTIFACT.abi,
                    functionName: "wrapERC20",
                    args: [to, token, amount],
                }),
                gas: 120_000n,
                nonce: ++nonce,
            },
        ];

        const payloads: TransactionRequest[] = [];
        const signedPayloads: string[] = [];
        const decodedSignedPayloads: TransactionSerializable[] = [];
        for (const txI of txInfo) {
            const pTx: TransactionRequest =
                await accountClient.prepareTransactionRequest({
                    ...txI,
                    value: 0n,
                    gasPrice: 1_000_000_000n, // 1 GWei
                    account,
                    chain: accountClient.chain,
                });

            const sTx = await accountClient.signTransaction(pTx as any);
            const dTx = parseTransaction(sTx);

            payloads.push(pTx);
            signedPayloads.push(sTx);
            decodedSignedPayloads.push(dTx);
        }
        const action: Types.Action = {
            networkId: 1, // Ethereum Sepolia
            payloads: payloads.map((p) => ({
                data: jsonStringify(p),
            })),
            signedPayloads,
        };

        return action;
    };
}
