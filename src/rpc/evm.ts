import type { EVM_NETWORKS, NETWORK_FLAVOUR } from "@/constants/networks";
import { evmMulticall3Abi } from "@/contracts/evm/abi/multicall3";
import { Rpc } from "@/rpc/abstract";
import type { CurvyAddress, CurvyAddressBalances } from "@/types/address";
import type { Network } from "@/types/api";
import type { HexString } from "@/types/helper";
import { networkGroupToSlug, toSlug } from "@/utils/helpers";
import { generateViemChainFromNetwork } from "@/utils/rpc";
import {
  http,
  type Address,
  type PublicClient,
  type WalletClient,
  createPublicClient,
  createWalletClient,
  decodeFunctionResult,
  encodeFunctionData,
  erc20Abi,
  getContract,
  parseEther,
  parseUnits,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { getBalance, readContract } from "viem/actions";

class EvmRpc extends Rpc {
  readonly #publicClient: PublicClient;
  readonly #walletClient: WalletClient;

  constructor(network: Network) {
    super(network);

    const chain = generateViemChainFromNetwork(network);

    this.#publicClient = createPublicClient({
      transport: http(this.network.rpcUrl),
      name: `CurvyEvmPublicClient-${toSlug(network.name)}`,
      chain,
    });

    this.#walletClient = createWalletClient({
      transport: http(this.network.rpcUrl),
      name: `CurvyEvmWalletClient-${toSlug(network.name)}`,
      chain,
    });
  }

  async getBalances(stealthAddress: CurvyAddress) {
    const evmMulticall = getContract({
      abi: evmMulticall3Abi,
      address: this.network.multiCallContractAddress as Address,
      client: this.#publicClient,
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

    return tokenBalances
      .map((encodedTokenBalance, idx) => {
        const { contract_address: tokenAddress, symbol, decimals } = this.network.currencies[idx];

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

        return balance ? { balance, symbol, tokenAddress, decimals } : null;
      })
      .filter(Boolean)
      .reduce<CurvyAddressBalances<NETWORK_FLAVOUR["EVM"]>>((res, { symbol, ...rest }) => {
        if (!res[networkSlug]) res[networkSlug] = Object.create(null);
        res[networkSlug][symbol] = rest;
        return res;
      }, Object.create(null));
  }

  async getBalance(stealthAddress: CurvyAddress, symbol: string) {
    const token = this.network.currencies.find((c) => c.symbol === symbol);
    if (!token) throw new Error(`Token ${symbol} not found.`);

    const { contract_address: tokenAddress, decimals } = token;

    let balance = 0n;

    if (!token.contract_address) {
      balance = await getBalance(this.#publicClient, {
        address: stealthAddress.address as Address,
      });
    }

    balance = await readContract(this.#publicClient, {
      address: token.contract_address as Address,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [stealthAddress.address as Address],
    });

    return { balance, tokenAddress, decimals };
  }

  async #prepareTx(privateKey: HexString, address: Address, amount: string, currency: string) {
    const token = this.network.currencies.find((c) => c.symbol === currency);
    if (!token) throw new Error(`Token ${currency} not found.`);

    const account = privateKeyToAccount(privateKey);

    const txRequestBase = {
      account,
      chain: this.#walletClient.chain,
    } as const;

    if (token.contract_address === undefined) {
      const gasLimit = await this.#publicClient
        .estimateGas({
          account,
          to: address,
          value: parseEther(amount),
        })
        .then((res) => res)
        .catch(() => 21_000n);

      return this.#walletClient.prepareTransactionRequest({
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

    const gasLimit = await this.#publicClient
      .estimateContractGas({
        account,
        address: token.contract_address as Address,
        abi: erc20Abi,
        functionName: "transfer",
        args: [address, parseUnits(amount, token.decimals)],
      })
      .then((res) => res)
      .catch(() => 65_000n);

    return this.#walletClient.prepareTransactionRequest({
      ...txRequestBase,
      to: token.contract_address as Address,
      gas: gasLimit,
      data,
      value: 0n,
    });
  }

  async sendToAddress(
    _curvyAddress: CurvyAddress,
    privateKey: HexString,
    address: string,
    amount: string,
    currency: string,
    fee?: bigint,
  ) {
    const txRequest = await this.#prepareTx(privateKey, address as `0x${string}`, amount, currency);
    const serializedTransaction = await this.#walletClient.signTransaction(txRequest);

    return this.#walletClient.sendRawTransaction({ serializedTransaction });
  }

  async estimateFee(
    _curvyAddress: CurvyAddress,
    privateKey: HexString,
    address: Address,
    amount: string,
    currency: string,
  ) {
    const txRequest = await this.#prepareTx(privateKey, address, amount, currency);

    return txRequest ? txRequest.maxFeePerGas * txRequest.gas : 0n;
  }

  feeToAmount(feeEstimate: bigint): bigint {
    return feeEstimate;
  }
}

export { EvmRpc };
