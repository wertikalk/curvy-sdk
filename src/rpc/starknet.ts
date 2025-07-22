import type { NETWORK_FLAVOUR, STARKNET_NETWORKS } from "@/constants/networks";
import { CURVY_ACCOUNT_CLASS_HASHES, CURVY_DUMMY_STARKNET_ACCOUNT } from "@/constants/starknet";
import { starknetAccountAbi } from "@/contracts/starknet/abi/account";
import { starknetErc20Abi } from "@/contracts/starknet/abi/erc20";
import { starknetMulticallAbi } from "@/contracts/starknet/abi/multicall";
import type { CurvyAddressBalances } from "@/curvy-address/interface";
import type { StarknetCurvyAddress } from "@/curvy-address/starknet";
import { networkGroupToSlug } from "@/utils/helpers";
import { decimalStringToHex } from "@/utils/publicKeyEncoding";
// TODO: Rename private methods
import {
  constants,
  Account,
  type BigNumberish,
  CairoCustomEnum,
  type Call,
  CallData,
  Contract,
  type DeployAccountContractPayload,
  type DeployContractResponse,
  type EstimateFee,
  EthSigner,
  Provider,
  type RawArgs,
  cairo,
  hash,
  validateAndParseAddress,
} from "starknet";
import { type Address, parseUnits } from "viem";
import RPC from "./abstract";

function fromUint256(l: BigNumberish, h: BigNumberish): bigint {
  const low = BigInt(l);
  const high = BigInt(h);

  const bhigh = high << 128n;
  return low + bhigh;
}

export type StarknetFeeEstimate = {
  deployFee: EstimateFee | undefined;
  transactionFee: EstimateFee;
};

export default class StarknetRPC extends RPC {
  private provider!: Provider;

  init() {
    this.provider = new Provider({
      chainId: constants.StarknetChainId.SN_MAIN,
      nodeUrl: this.network.rpcUrl,
    });
  }

  async getBalances(stealthAddress: StarknetCurvyAddress) {
    const starkMulticall = new Contract(
      starknetMulticallAbi,
      this.network.multiCallContractAddress as Address,
      this.provider,
    ).typedv2(starknetMulticallAbi);

    const calls = this.network.currencies.map(({ contract_address }) => ({
      execution: new CairoCustomEnum({
        Static: {},
      }),
      to: new CairoCustomEnum({
        Hardcoded: contract_address,
      }),
      selector: new CairoCustomEnum({
        Hardcoded: hash.getSelectorFromName("balance_of"),
      }),
      calldata: [new CairoCustomEnum({ Hardcoded: stealthAddress.address })],
    }));

    const tokenBalances = await starkMulticall.aggregate(calls);

    const networkSlug = networkGroupToSlug(this.network) as STARKNET_NETWORKS;
    const balances = tokenBalances
      .map(([low, high], idx) => {
        const { contract_address: tokenAddress, symbol } = this.network.currencies[idx];

        return {
          balance: fromUint256(low, high),
          symbol,
          tokenAddress,
        };
      })
      .filter((token) => Boolean(token.balance))
      .reduce<CurvyAddressBalances<NETWORK_FLAVOUR["STARKNET"]>>((res, { balance, symbol, tokenAddress }) => {
        res[networkSlug][symbol] = { balance, tokenAddress };
        return res;
      }, Object.create(null));

    stealthAddress.setBalances(this.network, balances);

    return stealthAddress.balances;
  }

  async getBalance(stealthAddress: StarknetCurvyAddress, symbol: string): Promise<bigint> {
    const token = this.network.currencies.find((c) => c.symbol === symbol);
    if (!token) throw new Error(`Token ${symbol} not found.`);

    const tokenAddress = token.contract_address;

    const starkErc20 = new Contract(starknetErc20Abi, token.contract_address as Address, this.provider).typedv2(
      starknetErc20Abi,
    );

    let balance = await starkErc20.balance_of(stealthAddress.address);

    if (typeof balance === "number") balance = BigInt(balance);
    if (typeof balance !== "bigint" && "low" in balance && "high" in balance)
      balance = fromUint256(balance.low, balance.high);

    stealthAddress.setBalance(this.network, { balance, symbol, tokenAddress });

    return balance;
  }

  private _PrepareTx(stealthAddress: StarknetCurvyAddress, address: Address, amount: string, currency: string) {
    const token = this.network.currencies.find((c) => c.symbol === currency);
    if (!token) throw new Error(`Token ${currency} not found.`);

    const starknetAccount = new Account(
      this.provider,
      stealthAddress.address,
      new EthSigner(stealthAddress.privateKey),
    );

    const txPayload = {
      contractAddress: token.contract_address as string,
      entrypoint: "transfer",
      calldata: CallData.compile({
        to: address,
        amount: cairo.uint256(parseUnits(amount, token?.decimals)),
      }),
    } satisfies Call;

    return { starknetAccount, txPayload };
  }

  private async _EstimateFee(starknetAccount: Account, txPayload: Call) {
    return starknetAccount.estimateFee(txPayload, {
      version: 3,
      skipValidate: false,
      resourceBounds: {
        l1_gas: {
          max_amount: "0x0",
          max_price_per_unit: "0x0",
        },
        l2_gas: {
          max_amount: "0x0",
          max_price_per_unit: "0x0",
        },
        l1_data_gas: {
          max_amount: "0x0",
          max_price_per_unit: "0x0",
        },
      },
    });
  }

  private async _CheckIsStarknetAccountDeployed(stealthAddress: StarknetCurvyAddress): Promise<boolean> {
    return this.provider
      .getClassHashAt(stealthAddress.address)
      .then(() => true)
      .catch(() => false);
  }

  private _GetStarknetAccountClassHash(address: Address, constructorCalldata: RawArgs, salt = "0x3327") {
    return CURVY_ACCOUNT_CLASS_HASHES.find((classHash) => {
      const computedAddress = hash.calculateContractAddressFromHash(salt, classHash, constructorCalldata, 0);
      if (validateAndParseAddress(computedAddress) === validateAndParseAddress(address)) {
        return classHash;
      }
    });
  }

  private async _PrepareDeploy(stealthAddress: StarknetCurvyAddress) {
    const starknetAccount = new Account(
      this.provider,
      stealthAddress.address,
      new EthSigner(stealthAddress.privateKey),
    );

    const hexPubKey = decimalStringToHex(stealthAddress.publicKey, false);

    const myCallData = new CallData(starknetAccountAbi);
    const constructorCalldata = myCallData.compile("constructor", {
      public_key: hexPubKey,
    });

    const classHash = this._GetStarknetAccountClassHash(stealthAddress.address as Address, constructorCalldata);

    if (!classHash) throw new Error("Tried to construct deploy payload with unsupported class hash!");

    const deployPayload = {
      classHash,
      constructorCalldata: constructorCalldata,
      addressSalt: "0x3327",
    } satisfies DeployAccountContractPayload;

    return { starknetAccount, deployPayload };
  }

  private async _EstimateDeployFee(stealthAddress: StarknetCurvyAddress) {
    const { starknetAccount, deployPayload } = await this._PrepareDeploy(stealthAddress);

    return starknetAccount.estimateAccountDeployFee(deployPayload, {
      version: 3,
      skipValidate: false,
      resourceBounds: {
        l1_gas: {
          max_amount: "0xffffffffffffffff",
          max_price_per_unit: "0x0",
        },
        l2_gas: {
          max_amount: "0xffffffffffffffff",
          max_price_per_unit: "0x0",
        },
        l1_data_gas: {
          max_amount: "0xffffffffffffffff",
          max_price_per_unit: "0x0",
        },
      },
    });
  }

  // TODO: Unused method
  async EstimateDeployFee(stealthAddress: StarknetCurvyAddress, skipCheck = false): Promise<bigint> {
    if (!skipCheck && (await this._CheckIsStarknetAccountDeployed(stealthAddress)))
      throw new Error(`Starknet account with address: ${stealthAddress.address} already deployed.`);

    const deployFeeEstimate = await this._EstimateDeployFee(stealthAddress);
    return deployFeeEstimate.overall_fee;
  }

  async DeployStarknetAccount(
    stealthAddress: StarknetCurvyAddress,
    skipCheck = false,
    fee?: EstimateFee,
  ): Promise<DeployContractResponse> {
    if (!skipCheck && (await this._CheckIsStarknetAccountDeployed(stealthAddress)))
      throw new Error(`Starknet account with address: ${stealthAddress.address} already deployed.`);

    const { starknetAccount, deployPayload } = await this._PrepareDeploy(stealthAddress);

    let deployFeeEstimate: EstimateFee;
    if (fee === undefined) {
      deployFeeEstimate = await this._EstimateDeployFee(stealthAddress);
    } else {
      deployFeeEstimate = fee;
    }

    return starknetAccount.deployAccount(deployPayload, {
      version: 3,
      resourceBounds: deployFeeEstimate.resourceBounds,
      maxFee: deployFeeEstimate.suggestedMaxFee,
    });
  }

  async SendToAddress(
    stealthAddress: StarknetCurvyAddress,
    address: string,
    amount: string,
    currency: string,
    fee?: StarknetFeeEstimate,
  ): Promise<string> {
    // TODO: Typify hash
    if (!(await this._CheckIsStarknetAccountDeployed(stealthAddress))) {
      await this.DeployStarknetAccount(stealthAddress, true, fee?.deployFee);
    }

    const { starknetAccount, txPayload } = this._PrepareTx(stealthAddress, address as `0x${string}`, amount, currency);

    let feeEstimate: EstimateFee;
    if (fee === undefined) {
      feeEstimate = await this._EstimateFee(starknetAccount, txPayload);
    } else {
      feeEstimate = fee.transactionFee;
    }

    const result = await starknetAccount.execute([txPayload], {
      version: 3,
      resourceBounds: feeEstimate.resourceBounds,
      maxFee: feeEstimate.suggestedMaxFee,
    });

    return result.transaction_hash;
  }

  async EstimateFee(
    stealthAddress: StarknetCurvyAddress,
    address: Address,
    amount: string,
    currency: string,
  ): Promise<StarknetFeeEstimate> {
    let deployFee: EstimateFee | undefined = undefined;
    const isDeployed = await this._CheckIsStarknetAccountDeployed(stealthAddress);
    if (!isDeployed) {
      deployFee = await this._EstimateDeployFee(stealthAddress);
    }

    let { starknetAccount, txPayload } = this._PrepareTx(stealthAddress, address, amount, currency);

    if (!isDeployed) {
      // Try to fool the estimator so that we can extract total fee (deploy + tx) for undeployed account.
      // This is a dummy Address/PK not used for anything.
      // Don't pointlessly send security vulnerability reports - rather teach us how to estimate undeployed account transactions without this.
      starknetAccount = new Account(
        this.provider,
        CURVY_DUMMY_STARKNET_ACCOUNT.address,
        CURVY_DUMMY_STARKNET_ACCOUNT.pk,
      );
    }

    const transactionFee = await this._EstimateFee(starknetAccount, txPayload);

    return { transactionFee, deployFee };
  }

  FeeToAmount(feeEstimate: StarknetFeeEstimate): bigint {
    return BigInt(feeEstimate.transactionFee.overall_fee) + BigInt(feeEstimate?.deployFee?.overall_fee ?? 0n);
  }
}
