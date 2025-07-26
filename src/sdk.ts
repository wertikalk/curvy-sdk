import { getAddress, parseSignature, verifyTypedData } from "viem";

import { Buffer } from "buffer";
import {
  SCAN_COMPLETE_EVENT,
  SCAN_ERROR_EVENT,
  SCAN_MATCH_EVENT,
  SCAN_PROGRESS_EVENT,
  SYNC_COMPLETE_EVENT,
  SYNC_ERROR_EVENT,
  SYNC_PROGRESS_EVENT,
  SYNC_STARTED_EVENT,
} from "@/constants/events";
import {
  type NETWORKS,
  type NETWORK_ENVIRONMENT_VALUES,
  NETWORK_FLAVOUR,
  type NETWORK_FLAVOUR_VALUES,
  type SUPPORTED_NETWORKS_VALUES,
} from "@/constants/networks";
import { CurvyEventEmitter } from "@/events";
import { ApiClient } from "@/http/api";
import type { IApiClient } from "@/interfaces/api";
import type { ICore } from "@/interfaces/core";
import type { ICurvyEventEmitter } from "@/interfaces/events";
import type { ICurvySdk } from "@/interfaces/sdk";
import type { IWalletManager } from "@/interfaces/wallet-manager";
import { newMultiRpc } from "@/rpc/factory";
import type { MultiRpc } from "@/rpc/multi";
import type { StorageInterface } from "@/storage/interface";
import { TemporaryStorage } from "@/storage/temporary-storage";
import type { CurvyAddress } from "@/types/address";
import type { Network } from "@/types/api";
import type {
  ScanCompleteEvent,
  ScanErrorEvent,
  ScanMatchEvent,
  SyncErrorEvent,
  SyncProgressEvent,
  SyncStartedEvent,
} from "@/types/events";
import { isHexString, isStarkentSignature } from "@/types/helper";
import type { StarknetFeeEstimate } from "@/types/rpc";
import {
  type EvmSignTypedDataParameters,
  type EvmSignatureData,
  type StarknetSignTypedDataParameters,
  type StarknetSignatureData,
  assertIsStarkentSignatureData,
} from "@/types/signature";
import { arrayBufferToHex, generateWalletId } from "@/utils/helpers";
import dayjs from "dayjs";
import { typedData } from "starknet";
import { getSignatureParams as evmGetSignatureParams } from "./constants/evm";
import { getSignatureParams as starknetGetSignatureParams } from "./constants/starknet";
import { Core } from "./core";
import { deriveAddress } from "./utils/address";
import { computePrivateKeys } from "./utils/keyComputation";
import { type NetworkFilter, filterNetworks } from "./utils/network";
import { CurvyWallet } from "./wallet";
import { WalletManager } from "./wallet-manager";

globalThis.Buffer = Buffer;

class CurvySDK implements ICurvySdk {
  readonly #apiClient: IApiClient;
  readonly #emitter: ICurvyEventEmitter;
  readonly #core: ICore;
  readonly #walletManager: IWalletManager;

  #networks: Network[];
  #rpcClient: MultiRpc | undefined;

  readonly storage: StorageInterface;

  private constructor(
    apiKey: string,
    core: Core,
    apiBaseUrl?: string,
    storage: StorageInterface = new TemporaryStorage(),
  ) {
    this.#core = core;
    this.#apiClient = new ApiClient(apiKey, apiBaseUrl);
    this.#emitter = new CurvyEventEmitter();
    this.#networks = [];
    this.storage = storage;
    this.#walletManager = new WalletManager(this.#apiClient, this.#emitter, this.storage, this.#core);
  }

  static async init(
    apiKey: string,
    networkFilter: NetworkFilter = undefined,
    apiBaseUrl?: string,
    storage?: StorageInterface,
    wasmUrl?: string,
  ) {
    const core = await Core.init(wasmUrl);

    const sdk = new CurvySDK(apiKey, core, apiBaseUrl, storage);
    sdk.#networks = await sdk.#apiClient.network.GetNetworks();

    if (networkFilter === undefined) {
      await sdk.setActiveNetworks(true as NetworkFilter); // testnets only
    } else {
      await sdk.setActiveNetworks(networkFilter);
    }

    return sdk;
  }

  get rpcClient() {
    if (!this.#rpcClient) {
      throw new Error("RPC client is not initialized!");
    }

    return this.#rpcClient;
  }

  get wallets() {
    return this.#walletManager.wallets;
  }

  getStealthAddressById(id: string) {
    return this.storage.getCurvyAddressById(id);
  }

  getNetwork(networkFilter: NetworkFilter = undefined) {
    const networks = filterNetworks(this.#networks, networkFilter);

    if (networks.length === 0) {
      throw new Error(`Expected exactly one, but no network found with filter ${networkFilter}`);
    }

    if (networks.length > 1) {
      throw new Error(`Expected exactly one, but more than one network found with filter ${networkFilter}`);
    }

    return networks[0];
  }

  getNetworks(networkFilter: NetworkFilter = undefined) {
    return filterNetworks(this.#networks, networkFilter);
  }

  getNetworkByNetworkSlug(networkSlug: NETWORKS) {
    const [networkGroup, environment] = networkSlug.split("-") as [
      SUPPORTED_NETWORKS_VALUES,
      NETWORK_ENVIRONMENT_VALUES,
    ];

    const networks = this.getNetworks(
      (network) => network.group.toLowerCase() === networkGroup && (environment === "testnet") === network.testnet,
    );

    if (networks.length !== 1) {
      return undefined;
    }

    return networks[0];
  }

  async getNewStealthAddressForUser(networkIdentifier: NetworkFilter, handle: string) {
    const { data: recipientDetails } = await this.#apiClient.user.ResolveCurvyHandle(handle);

    if (!recipientDetails) {
      throw new Error(`Handle ${handle} not found`);
    }

    const { spendingKey, viewingKey } = recipientDetails.publicKeys[0];

    const {
      spendingPubKey: recipientStealthPublicKey,
      R: ephemeralPublicKey,
      viewTag,
    } = this.#core.send(spendingKey, viewingKey);

    const network = this.getNetwork(networkIdentifier);

    const derivedAddress = deriveAddress(recipientStealthPublicKey, network.flavour);

    if (!derivedAddress) throw new Error("Couldn't derive address!");

    const response = await this.#apiClient.announcement.CreateAnnouncement({
      recipientStealthAddress: derivedAddress,
      recipientStealthPublicKey,
      network_id: network.id,
      ephemeralPublicKey,
      viewTag: viewTag,
    });

    if (response.data?.message !== "Saved") throw new Error("Failed to register announcement");

    return derivedAddress;
  }

  getNativeCurrencyForNetwork(network: Network) {
    //TODO: Don't do starknet specific like this
    if (network.flavour === "starknet") {
      const currency = network.currencies.find(({ symbol }) => {
        return symbol === "STRK";
      });

      if (currency) {
        return currency;
      }
      throw new Error(`No native currency found for network ${network.name}`);
    }

    const currency = network.currencies.find(({ contract_address }) => contract_address === undefined);

    if (!currency) {
      throw new Error(`No native currency found for network ${network.name}`);
    }

    return currency;
  }

  async getSignatureParamsForNetworkFlavour(flavour: NETWORK_FLAVOUR_VALUES, ownerAddress: string, password: string) {
    const encoder = new TextEncoder();

    let address = ownerAddress;

    if (flavour === "evm") {
      address = getAddress(ownerAddress); // If it's EVM connection, do EIP-55 checksum of address
    } else if (flavour === "starknet") {
      address = `0x${ownerAddress.replace("0x", "").padStart(64, "0")}`; // If it's Starknet, pad with 0s up to 64 chars
    }

    const preimage = `${address}::${password}`;
    const encodedPreimage = encoder.encode(preimage);
    const hash = await crypto.subtle.digest("SHA-512", encodedPreimage);
    const hexHash = arrayBufferToHex(hash);

    switch (flavour) {
      case "evm":
        return evmGetSignatureParams(hexHash);
      case "starknet":
        return starknetGetSignatureParams(hexHash);
      default:
        throw new Error(`Unrecognized network flavour: ${flavour}`);
    }
  }

  async setActiveNetworks(networkFilter: NetworkFilter) {
    const networks = this.getNetworks(networkFilter);
    if (!networks.length) {
      throw new Error(`Network array is empty after filtering with ${networkFilter}`);
    }
    this.#rpcClient = await newMultiRpc(networks);
  }

  async #verifySignature(
    flavour: NETWORK_FLAVOUR_VALUES,
    signature: EvmSignatureData | StarknetSignatureData,
  ): Promise<[r: string, s: string]> {
    const { signatureParams, signingAddress, signatureResult } = signature;

    switch (true) {
      case NETWORK_FLAVOUR.EVM && isHexString(signatureResult): {
        const signature = parseSignature(signatureResult);

        const isValidSignature = verifyTypedData({
          signature,
          address: signingAddress,
          ...(signatureParams as EvmSignTypedDataParameters),
        });

        if (!isValidSignature) {
          throw new Error("Signature verification failed. Invalid signature.");
        }

        return [signature.r, signature.s];
      }
      case NETWORK_FLAVOUR.STARKNET && isStarkentSignature(signatureResult): {
        assertIsStarkentSignatureData(signature);

        const { signingPublicKey, signingWalletId } = signature;

        if (!signatureResult[0] || !signatureResult[1]) throw new Error("Signature failed - too few values.");

        const isValidSignature = typedData.verifyMessage(
          signatureParams as StarknetSignTypedDataParameters,
          signatureResult,
          signingPublicKey,
          signingAddress,
        );

        if (!isValidSignature) {
          throw new Error("Signature verification failed. Invalid signature.");
        }

        switch (signingWalletId) {
          case "argentX": {
            if (signatureResult.length === 2) {
              return signatureResult as [string, string];
            }

            if (signatureResult.length === 5) {
              return signatureResult.slice(3) as [string, string];
            }

            throw new Error("Only argentX single signer account is supported.");
          }
          case "braavos": {
            if (signatureResult.length !== 3) {
              throw new Error("Only braavos single signer account is supported.");
            }

            return signatureResult.slice(1) as [string, string];
          }
          default: {
            throw new Error(`Unrecognized wallet type: ${signingWalletId}. Only argentX and braavos are supported.`);
          }
        }
      }
      default: {
        throw new Error(`Unrecognized network flavour: ${flavour}`);
      }
    }
  }

  async addWalletWithSignature(flavour: NETWORK_FLAVOUR["EVM"], signature: EvmSignatureData): Promise<CurvyWallet>;
  async addWalletWithSignature(
    flavour: NETWORK_FLAVOUR["STARKNET"],
    signature: StarknetSignatureData,
  ): Promise<CurvyWallet>;
  async addWalletWithSignature(flavour: NETWORK_FLAVOUR_VALUES, signature: EvmSignatureData | StarknetSignatureData) {
    const [sigR, sigS] = await this.#verifySignature(flavour, signature);
    const { s, v } = computePrivateKeys(BigInt(sigS), BigInt(sigR));

    const keyPairs = this.#core.getCurvyKeys(s, v);

    const curvyHandle = await this.#apiClient.user.GetCurvyHandleByOwnerAddress(signature.signingAddress);

    if (!curvyHandle) {
      throw new Error(`No Curvy handle found for owner address: ${signature.signingAddress}`);
    }

    const { data: ownerDetails } = await this.#apiClient.user.ResolveCurvyHandle(curvyHandle);

    if (!ownerDetails) throw new Error(`Handle ${curvyHandle} does not exist.`);

    const { createdAt, publicKeys } = ownerDetails;

    if (!publicKeys.some(({ viewingKey: V, spendingKey: S }) => V === keyPairs.V && S === keyPairs.S))
      throw new Error(`Wrong password for handle ${curvyHandle}.`);

    const walletId = await generateWalletId(keyPairs.s, keyPairs.v);

    const wallet = new CurvyWallet(walletId, +dayjs(createdAt), curvyHandle, signature.signingAddress, keyPairs);

    await this.#walletManager.addWallet(wallet);

    return wallet;
  }

  async refreshBalances() {
    if (!this.rpcClient) {
      throw new Error("rpcClient not initialized");
    }

    for (const wallet of this.wallets) {
      for (const address of await this.storage.getCurvyAddressesByWalletId(wallet.id)) {
        await this.storage.updateCurvyAddress(address.id, { balances: await this.rpcClient.getBalances(address) });
      }
    }
  }

  async estimateFee(
    from: CurvyAddress,
    networkIdentifier: NetworkFilter,
    to: string,
    amount: string,
    currency: string,
  ) {
    let toAddress = to;

    if (to.endsWith(".staging-curvy.name") || to.endsWith(".curvy.name")) {
      toAddress = await this.getNewStealthAddressForUser(networkIdentifier, to);
    }

    const wallet = this.#walletManager.getWalletById(from.walletId);
    if (!wallet) {
      throw new Error(`Cannot send from address ${from.id} because it's wallet is not found!`);
    }
    const { s, v } = wallet.keyPairs;

    const {
      spendingPrivKeys: [privateKey],
    } = this.#core.scan(s, v, [from]);

    return this.rpcClient.Network(networkIdentifier).estimateFee(from, privateKey, toAddress, amount, currency);
  }

  async send(
    from: CurvyAddress,
    networkIdentifier: NetworkFilter,
    to: string,
    amount: string,
    currency: string,
    fee: StarknetFeeEstimate | bigint,
  ) {
    let toAddress = to;

    if (to.endsWith(".staging-curvy.name") || to.endsWith(".curvy.name")) {
      toAddress = await this.getNewStealthAddressForUser(networkIdentifier, to);
    }
    const wallet = this.#walletManager.getWalletById(from.walletId);
    if (!wallet) {
      throw new Error(`Cannot send from address ${from.id} because it's wallet is not found!`);
    }
    const { s, v } = wallet.keyPairs;

    const {
      spendingPrivKeys: [privateKey],
    } = this.#core.scan(s, v, [from]);

    return this.rpcClient.Network(networkIdentifier).sendToAddress(from, privateKey, toAddress, amount, currency, fee);
  }

  onSyncStarted(listener: (event: SyncStartedEvent) => void) {
    this.#emitter.on(SYNC_STARTED_EVENT, listener);
  }

  onSyncProgress(listener: (event: SyncProgressEvent) => void) {
    this.#emitter.on(SYNC_PROGRESS_EVENT, listener);
  }

  onSyncComplete(listener: (event: SyncProgressEvent) => void) {
    this.#emitter.on(SYNC_COMPLETE_EVENT, listener);
  }

  onSyncError(listener: (event: SyncErrorEvent) => void) {
    this.#emitter.on(SYNC_ERROR_EVENT, listener);
  }

  onScanProgress(listener: (event: ScanErrorEvent) => void) {
    this.#emitter.on(SCAN_PROGRESS_EVENT, listener);
  }

  onScanComplete(listener: (event: ScanCompleteEvent) => void) {
    this.#emitter.on(SCAN_COMPLETE_EVENT, listener);
  }

  onScanMatch(listener: (event: ScanMatchEvent) => void) {
    this.#emitter.on(SCAN_MATCH_EVENT, listener);
  }

  onScanError(listener: (event: ScanErrorEvent) => void) {
    this.#emitter.on(SCAN_ERROR_EVENT, listener);
  }
}

export { CurvySDK };
