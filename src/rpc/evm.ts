import {
    http,
    type Address,
    type PublicClient,
    type SendRawTransactionReturnType,
    type WalletClient,
    createPublicClient,
    createWalletClient,
    decodeFunctionResult,
    defineChain,
    encodeFunctionData,
    erc20Abi,
    getContract,
    parseEther,
    parseUnits,
    Chain,
    TransactionRequest,
    // SignTransactionReturnType,
    parseTransaction,
    TransactionSerializable,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { getBalance, readContract } from "viem/actions";
import { evmMulticall3Abi } from "../contracts/evm/abi/multicall3";
import type CurvyStealthAddress from "../stealth-address";
import RPC from "./abstract";
import { CSUC } from "../constants/evm";
import { ARTIFACT as CSUC_ETH_SEPOLIA_ARTIFACT } from "../contracts/evm/curvy-artifacts/ethereum-sepolia/CSUC";
import { jsonStringify } from "../utils/common";
import { GasSponsorship } from "../types";

export default class EVMRPC extends RPC {
    private publicClient!: PublicClient;
    private walletClient!: WalletClient;
    private chain!: Chain;

    init() {
        const { name, symbol, decimals } = this.network.currencies.find(
            ({ contract_address }) => contract_address === undefined
        ) || { name: "Ether", symbol: "ETH", decimals: 18 };

        this.chain = defineChain({
            id: Number(this.network.chainId),
            name: this.network.name,
            rpcUrls: {
                default: {
                    http: [this.network.rpcUrl],
                },
            },
            nativeCurrency: {
                name,
                symbol,
                decimals,
            },
        });

        this.publicClient = createPublicClient({
            transport: http(this.network.rpcUrl),
            chain: this.chain,
        });

        this.walletClient = createWalletClient({
            transport: http(this.network.rpcUrl),
            chain: this.chain,
        });
    }

    async GetBalances(stealthAddress: CurvyStealthAddress) {
        const evmMulticall = getContract({
            abi: evmMulticall3Abi,
            address: this.network.multiCallContractAddress as Address,
            client: this.publicClient,
        });

        const calls = this.network.currencies.map(({ contract_address }) => {
            if (!contract_address)
                return {
                    target: evmMulticall.address,
                    callData: encodeFunctionData({
                        abi: evmMulticall3Abi,
                        functionName: "getEthBalance",
                        args: [stealthAddress.address as Address],
                    }),
                    gasLimit: 30_000n,
                };

            return {
                target: contract_address as Address,
                callData: encodeFunctionData({
                    abi: erc20Abi,
                    functionName: "balanceOf",
                    args: [stealthAddress.address as Address],
                }),
                gasLimit: 30_000n,
            };
        });

        const {
            result: [_, tokenBalances],
        } = await evmMulticall.simulate.aggregate([calls]);

        const balances = tokenBalances
            .map((encodedTokenBalance, idx) => {
                const tokenAddress =
                    this.network.currencies[idx]?.contract_address;
                const symbol = this.network.currencies[idx]?.symbol;
                let balance = 0n;

                if (!tokenAddress)
                    balance = decodeFunctionResult({
                        abi: evmMulticall3Abi,
                        functionName: "getEthBalance",
                        data: encodedTokenBalance,
                    });
                else
                    balance = decodeFunctionResult({
                        abi: erc20Abi,
                        functionName: "balanceOf",
                        data: encodedTokenBalance,
                    });

                return balance ? { balance, symbol } : null;
            })
            .filter((balance) => balance !== null);

        // TODO: see if I need a separate reduce or just one.
        const goodBalances = balances.reduce((acc, balance, _) => {
            acc[balance.symbol] = balance.balance;
            return acc;
        }, {} as Record<string, bigint>);

        stealthAddress.SetBalances(this.network, goodBalances);
        return stealthAddress.balances;
    }

    async GetBalance(
        stealthAddress: CurvyStealthAddress,
        currency: string
    ): Promise<bigint> {
        const token = this.network.currencies.find(
            (c) => c.symbol === currency
        );
        if (!token) throw new Error(`Token ${currency} not found.`);

        let balance = 0n;

        if (!token.contract_address) {
            balance = await getBalance(this.publicClient, {
                address: stealthAddress.address as Address,
            });
        }

        balance = await readContract(this.publicClient, {
            address: token.contract_address as Address,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [stealthAddress.address as Address],
        });

        stealthAddress.SetBalance(currency, balance);
        return balance;
    }

    async SignTransaction(
        stealthAddress: CurvyStealthAddress,
        txRequest: any
    ): Promise<SendRawTransactionReturnType> {
        const serializedTransaction = await this.walletClient.signTransaction(
            txRequest
        );

        return this.walletClient.sendRawTransaction({ serializedTransaction });
    }

    async _PrepareTx(
        { privateKey }: CurvyStealthAddress,
        address: Address,
        amount: string,
        currency: string
    ) {
        const token = this.network.currencies.find(
            (c) => c.symbol === currency
        );
        if (!token) throw new Error(`Token ${currency} not found.`);

        const account = privateKeyToAccount(privateKey as Address);

        const txRequestBase = {
            account,
            chain: this.walletClient.chain,
        } as const;

        if (token.contract_address === undefined) {
            const gasLimit = await this.publicClient
                .estimateGas({
                    account,
                    to: address,
                    value: parseEther(amount),
                })
                .then((res) => res)
                .catch(() => 21_000n);

            return this.walletClient.prepareTransactionRequest({
                ...txRequestBase,
                to: address,
                value: parseEther(amount),
                gas: gasLimit,
            });
        }

        const data = encodeFunctionData({
            abi: erc20Abi,
            functionName: "transfer",
            args: [address, parseUnits(amount, token.decimals)],
        });

        const gasLimit = await this.publicClient
            .estimateContractGas({
                account,
                address: token.contract_address as Address,
                abi: erc20Abi,
                functionName: "transfer",
                args: [address, parseUnits(amount, token.decimals)],
            })
            .then((res) => res)
            .catch(() => 65_000n);

        return this.walletClient.prepareTransactionRequest({
            ...txRequestBase,
            to: token.contract_address as Address,
            gas: gasLimit,
            data,
            value: 0n,
        });
    }

    // async SendToCurvyUser(
    //   stealthAddress: CurvyStealthAddress,
    //   handle: string,
    //   amount: string,
    //   currency: string,
    // ): Promise<SendRawTransactionReturnType> {
    //   return this._Send(stealthAddress, "" as Address, amount, currency);
    // }
    async SendToAddress(
        stealthAddress: CurvyStealthAddress,
        address: string,
        amount: string,
        currency: string,
        fee?: bigint
    ): Promise<SendRawTransactionReturnType> {
        const txRequest = await this._PrepareTx(
            stealthAddress,
            address as `0x${string}`,
            amount,
            currency
        );
        const serializedTransaction = await this.walletClient.signTransaction(
            txRequest
        );

        return this.walletClient.sendRawTransaction({ serializedTransaction });
    }

    async EstimateFee(
        stealthAddress: CurvyStealthAddress,
        address: Address,
        amount: string,
        currency: string
    ): Promise<bigint> {
        const txRequest = await this._PrepareTx(
            stealthAddress,
            address,
            amount,
            currency
        );

        return txRequest ? txRequest.maxFeePerGas * txRequest.gas : 0n;
    }

    FeeToAmount(feeEstimate: bigint): bigint {
        return feeEstimate;
    }

    async CreateReferenceToERC20(token: Address): Promise<any> {
        return getContract({
            address: token,
            abi: erc20Abi,
            client: this.walletClient,
        });
    }

    // async GetBalanceCSUC(
    //     stealthAddress: CurvyStealthAddress,
    //     token: Address
    // ): Promise<Record<string, bigint>> {
    //     const balances = await this.GetBalances(stealthAddress);
    //     stealthAddress.SetBalances(this.network, balances);
    //     return stealthAddress.balances;
    // }

    async PrepareTransferIntoCSUC(
        from: CurvyStealthAddress,
        to: `0x${string}`,
        token: `0x${string}`,
        amount: bigint
    ): Promise<GasSponsorship.Action> {
        // Legacy CSA
        const account = privateKeyToAccount(from.privateKey as `0x${string}`);
        let nonce = await this.publicClient.getTransactionCount({
            address: account.address,
        });
        const { Main: MainCSUC } = CSUC.DeploymentAddresses[
            "ethereum-sepolia"
        ] as any;

        const walletClient = createWalletClient({
            transport: http(this.network.rpcUrl),
            chain: sepolia,
            account,
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
                await walletClient.prepareTransactionRequest({
                    ...txI,
                    value: 0n,
                    gasPrice: 1_000_000_000n, // 1 GWei
                    account,
                    chain: walletClient.chain,
                });

            const sTx = await walletClient.signTransaction(pTx as any);
            const dTx = parseTransaction(sTx);

            payloads.push(pTx);
            signedPayloads.push(sTx);
            decodedSignedPayloads.push(dTx);
        }
        const action: GasSponsorship.Action = {
            networkId: 1, // Ethereum Sepolia
            payloads: payloads.map((p) => ({
                data: jsonStringify(p),
            })),
            signedPayloads,
        };

        return action;
    }

    async CreateReferenceToCSUC(): Promise<any> {
        const { Main: MainCSUC } = CSUC.DeploymentAddresses["ethereum-sepolia"];

        return getContract({
            address: MainCSUC as any,
            abi: CSUC_ETH_SEPOLIA_ARTIFACT.abi,
            client: this.walletClient,
        });
    }
}
