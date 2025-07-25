import { getAddress } from "viem";

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
import type {
  NETWORKS,
  NETWORK_ENVIRONMENT_VALUES,
  NETWORK_FLAVOUR_VALUES,
  SUPPORTED_NETWORKS_VALUES,
} from "@/constants/networks";
import { CurvyEventEmitter } from "@/events";
import { ApiClient } from "@/http/api";
import type { CurvyAddress } from "@/interfaces/address";
import { newMultiRpc } from "@/rpc/factory";
import type { MultiRpc } from "@/rpc/multi";
import type { StorageInterface } from "@/storage/interface";
import { TemporaryStorage } from "@/storage/temporary-storage";
import type { Currency, Network } from "@/types/api";
import type {
  ScanCompleteEvent,
  ScanErrorEvent,
  ScanMatchEvent,
  SyncErrorEvent,
  SyncProgressEvent,
  SyncStartedEvent,
} from "@/types/events";
import type { StarknetFeeEstimate } from "@/types/rpc";
import { arrayBufferToHex, generateWalletId } from "@/utils/helpers";
import dayjs from "dayjs";
import { Signature } from "ethers";
import { getSignatureParams as evmGetSignatureParams } from "./constants/evm";
import { getSignatureParams as starknetGetSignatureParams } from "./constants/starknet";
import { Core } from "./core";
import { deriveAddress } from "./utils/address";
import { computePrivateKeys } from "./utils/keyComputation";
import { type NetworkFilter, filterNetworks } from "./utils/network";
import { CurvyWallet } from "./wallet";
import { WalletManager } from "./wallet-manager";

globalThis.Buffer = Buffer;

class CurvySDK {
  readonly #client: ApiClient;
  readonly #emitter: CurvyEventEmitter;
  readonly #core: Core;
  readonly #walletManager: WalletManager;

  readonly storage: StorageInterface;

  #networks: Network[];
  #rpcClient: MultiRpc | undefined;

  private constructor(
    apiKey: string,
    core: Core,
    apiBaseUrl?: string,
    storage: StorageInterface = new TemporaryStorage(),
  ) {
    this.#core = core;
    this.#client = new ApiClient(apiKey, apiBaseUrl);
    this.#emitter = new CurvyEventEmitter();
    this.#networks = [];
    this.storage = storage;
    this.#walletManager = new WalletManager(this.#client, this.#emitter, this.storage, this.#core);
  }

  get rpcClient(): MultiRpc {
    if (!this.#rpcClient) {
      throw new Error("RPC client is not initialized!");
    }

    return this.#rpcClient;
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
    sdk.#networks = await sdk.#client.network.GetNetworks();

    if (networkFilter === undefined) {
      await sdk.SetActiveNetworks(true as NetworkFilter); // testnets only
    } else {
      await sdk.SetActiveNetworks(networkFilter);
    }

    return sdk;
  }

  public GetNetworkByNetworkSlug(networkSlug: NETWORKS): Network | undefined {
    const [networkGroup, environment] = networkSlug.split("-") as [
      SUPPORTED_NETWORKS_VALUES,
      NETWORK_ENVIRONMENT_VALUES,
    ];

    const networks = this.GetNetworks(
      (network) => network.group.toLowerCase() === networkGroup && (environment === "testnet") === network.testnet,
    );

    if (networks.length !== 1) {
      return undefined;
    }

    return networks[0];
  }

  public GetWallets(): CurvyWallet[] {
    return this.#walletManager.wallets;
  }

  public GetStealthAddress(id: string): Promise<CurvyAddress | undefined> {
    return this.storage.getCurvyAddressById(id);
  }

  public GetNetworks(networkFilter: NetworkFilter = undefined): Network[] {
    return filterNetworks(this.#networks, networkFilter);
  }

  public GetNetwork(networkFilter: NetworkFilter = undefined): Network {
    const networks = filterNetworks(this.#networks, networkFilter);

    if (networks.length === 0) {
      throw new Error(`Expected exactly one, but no network found with filter ${networkFilter}`);
    }

    if (networks.length > 1) {
      throw new Error(`Expected exactly one, but more than one network found with filter ${networkFilter}`);
    }

    return networks[0];
  }

  public async GetNewStealthAddressForUser(networkIdentifier: NetworkFilter, handle: string): Promise<`0x${string}`> {
    const { data: recipientDetails } = await this.#client.user.ResolveCurvyHandle(handle);

    if (!recipientDetails) {
      throw new Error(`Handle ${handle} not found`);
    }

    const { spendingKey, viewingKey } = recipientDetails.publicKeys[0];

    const {
      spendingPubKey: recipientStealthPublicKey,
      R: ephemeralPublicKey,
      viewTag,
    } = this.#core.send(spendingKey, viewingKey);

    const network = this.GetNetwork(networkIdentifier);

    const derivedAddress = deriveAddress(recipientStealthPublicKey, network.flavour);

    if (!derivedAddress) throw new Error("Couldn't derive address!");

    const response = await this.#client.announcement.CreateAnnouncement({
      recipientStealthAddress: derivedAddress,
      recipientStealthPublicKey,
      network_id: network.id,
      ephemeralPublicKey,
      viewTag: viewTag,
    });

    if (response.data?.message !== "Saved") throw new Error("Failed to register announcement");

    return derivedAddress;
  }

  public async EstimateFee(
    from: CurvyAddress,
    networkIdentifier: NetworkFilter,
    to: string,
    amount: string,
    currency: string,
  ) {
    let toAddress = to;

    if (to.endsWith(".staging-curvy.name") || to.endsWith(".curvy.name")) {
      toAddress = await this.GetNewStealthAddressForUser(networkIdentifier, to);
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

  public async Send(
    from: CurvyAddress,
    networkIdentifier: NetworkFilter,
    to: string,
    amount: string,
    currency: string,
    fee: StarknetFeeEstimate | bigint,
  ) {
    let toAddress = to;

    if (to.endsWith(".staging-curvy.name") || to.endsWith(".curvy.name")) {
      toAddress = await this.GetNewStealthAddressForUser(networkIdentifier, to);
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

  public async SetActiveNetworks(networkFilter: NetworkFilter) {
    const networks = this.GetNetworks(networkFilter);
    if (!networks.length) {
      throw new Error(`Network array is empty after filtering with ${networkFilter}`);
    }
    this.#rpcClient = await newMultiRpc(networks);
  }

  // // GetAnnouncements retrieves announcements from storage based on query parameters
  public async GetAnnouncements(query: {
    startTime?: Date;
    endTime?: Date;
    size?: number;
    offset?: number;
    networkId?: number[];
  }) {
    // return this.announcementStorage.GetAnnouncements(query);
  }

  public GetNativeCurrencyForNetwork(network: Network): Currency {
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

  public async GetSignatureParamsForNetworkFlavour(
    flavour: NETWORK_FLAVOUR_VALUES,
    ownerAddress: string,
    password: string,
  ) {
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

  public async AddWalletWithSignature(
    ownerAddress: string,
    rawSignature: `0x${string}` | string[],
  ): Promise<CurvyWallet> {
    let sigS: bigint = BigInt(0);
    let sigR: bigint = BigInt(0);
    let address = ownerAddress;

    // If is array, then we are parsing Starknet signatures
    if (Array.isArray(rawSignature)) {
      // TODO: Dedupe
      address = `0x${ownerAddress.replace("0x", "").padStart(64, "0")}`; // If it's Starknet, pad with 0s up to 64 chars

      if (rawSignature.length === 2) {
        sigR = BigInt(rawSignature[0]);
        sigS = BigInt(rawSignature[1]);
      }

      if (rawSignature.length === 5) {
        sigR = BigInt(rawSignature[3]);
        sigS = BigInt(rawSignature[4]);
      }

      if (rawSignature.length === 3) {
        sigR = BigInt(rawSignature[1]);
        sigS = BigInt(rawSignature[2]);
      }
    } else if (typeof rawSignature === "string") {
      const signature = Signature.from(rawSignature);
      sigR = BigInt(signature.r);
      sigS = BigInt(signature.s);
    }

    if (sigS === BigInt(0) && sigR === BigInt(0)) {
      throw new Error("Unrecognized signature format!");
    }

    const { s, v } = computePrivateKeys(sigS, sigR);

    const keyPairs = this.#core.getCurvyKeys(s, v);

    const curvyHandle = await this.#client.user.GetCurvyHandleByOwnerAddress(address);

    if (!curvyHandle) {
      throw new Error(`No Curvy handle found for owner address: ${ownerAddress}`);
    }

    const { data: ownerDetails } = await this.#client.user.ResolveCurvyHandle(curvyHandle);

    if (!ownerDetails) throw new Error(`Handle ${curvyHandle} does not exist.`);

    const { createdAt, publicKeys } = ownerDetails;

    if (!publicKeys.some(({ viewingKey: V, spendingKey: S }) => V === keyPairs.V && S === keyPairs.S))
      throw new Error(`Wrong password for handle ${curvyHandle}.`);

    const walletId = await generateWalletId(keyPairs.s, keyPairs.v);

    const wallet = new CurvyWallet(walletId, +dayjs(createdAt), curvyHandle, address, keyPairs);

    await this.#walletManager.addWallet(wallet);

    return wallet;
  }

  public async RefreshBalances() {
    if (!this.rpcClient) {
      throw new Error("rpcClient not initialized");
    }

    for (const wallet of this.GetWallets()) {
      for (const address of await this.storage.getCurvyAddressesByWalletId(wallet.id)) {
        await this.storage.updateCurvyAddress(address.id, { balances: await this.rpcClient.getBalances(address) });
      }
    }
  }

  // Subscribe to sync started events
  public onSyncStarted(listener: (event: SyncStartedEvent) => void): void {
    this.#emitter.on(SYNC_STARTED_EVENT, listener);
  }

  // Subscribe to sync progress events
  public onSyncProgress(listener: (event: SyncProgressEvent) => void): void {
    this.#emitter.on(SYNC_PROGRESS_EVENT, listener);
  }

  // Subscribe to sync complete events
  public onSyncComplete(listener: (event: SyncProgressEvent) => void): void {
    this.#emitter.on(SYNC_COMPLETE_EVENT, listener);
  }

  // Subscribe to sync error events
  public onSyncError(listener: (event: SyncErrorEvent) => void): void {
    this.#emitter.on(SYNC_ERROR_EVENT, listener);
  }

  // Subscribe to scan progress events
  public onScanProgress(listener: (event: ScanErrorEvent) => void): void {
    this.#emitter.on(SCAN_PROGRESS_EVENT, listener);
  }

  // Subscribe to scan complete events
  public onScanComplete(listener: (event: ScanCompleteEvent) => void): void {
    this.#emitter.on(SCAN_COMPLETE_EVENT, listener);
  }

  // Subscribe to scan match events
  public onScanMatch(listener: (event: ScanMatchEvent) => void): void {
    this.#emitter.on(SCAN_MATCH_EVENT, listener);
  }

  // Subscribe to scan error events
  public onScanError(listener: (event: ScanErrorEvent) => void): void {
    this.#emitter.on(SCAN_ERROR_EVENT, listener);
  }
}

export { CurvySDK };
