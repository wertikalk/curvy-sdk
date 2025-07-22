import type { EVM_NETWORKS, NETWORK_FLAVOUR } from "@/constants/networks";
import { evmMulticall3Abi } from "@/contracts/evm/abi/multicall3";
import type { EVMCurvyAddress } from "@/curvy-address/evm";
import type { CurvyAddressBalances } from "@/curvy-address/interface";
import { networkGroupToSlug } from "@/utils/helpers";
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
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { getBalance, readContract } from "viem/actions";
import RPC from "./abstract";

export default class EVMRPC extends RPC {
  private publicClient!: PublicClient;
  private walletClient!: WalletClient;

  init() {
    const { name, symbol, decimals } = this.network.currencies.find(
      ({ contract_address }) => contract_address === undefined,
    ) || { name: "Ether", symbol: "ETH", decimals: 18 };

    const chain = defineChain({
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
      chain,
    });

    this.walletClient = createWalletClient({
      transport: http(this.network.rpcUrl),
      chain,
    });
  }

  async getBalances(stealthAddress: EVMCurvyAddress) {
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

    const networkSlug = networkGroupToSlug(this.network) as EVM_NETWORKS;
    const balances = tokenBalances
      .map((encodedTokenBalance, idx) => {
        const { contract_address: tokenAddress, symbol } = this.network.currencies[idx];

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

        return balance ? { balance, symbol, tokenAddress } : null;
      })
      .filter(Boolean)
      .reduce<CurvyAddressBalances<NETWORK_FLAVOUR["EVM"]>>((res, { balance, symbol, tokenAddress }) => {
        res[networkSlug][symbol] = { balance, tokenAddress };
        return res;
      }, Object.create(null));

    stealthAddress.setBalances(this.network, balances);
    return stealthAddress.balances;
  }

  async getBalance(stealthAddress: EVMCurvyAddress, symbol: string): Promise<bigint> {
    const token = this.network.currencies.find((c) => c.symbol === symbol);
    if (!token) throw new Error(`Token ${symbol} not found.`);

    const tokenAddress = token.contract_address;

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

    stealthAddress.setBalance(this.network, { symbol, balance, tokenAddress });
    return balance;
  }

  async _PrepareTx({ privateKey }: EVMCurvyAddress, address: Address, amount: string, currency: string) {
    const token = this.network.currencies.find((c) => c.symbol === currency);
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

  async SendToAddress(
    stealthAddress: EVMCurvyAddress,
    address: string,
    amount: string,
    currency: string,
    fee?: bigint,
  ): Promise<SendRawTransactionReturnType> {
    const txRequest = await this._PrepareTx(stealthAddress, address as `0x${string}`, amount, currency);
    const serializedTransaction = await this.walletClient.signTransaction(txRequest);

    return this.walletClient.sendRawTransaction({ serializedTransaction });
  }

  async EstimateFee(
    stealthAddress: EVMCurvyAddress,
    address: Address,
    amount: string,
    currency: string,
  ): Promise<bigint> {
    const txRequest = await this._PrepareTx(stealthAddress, address, amount, currency);

    return txRequest ? txRequest.maxFeePerGas * txRequest.gas : 0n;
  }

  FeeToAmount(feeEstimate: bigint): bigint {
    return feeEstimate;
  }
}
