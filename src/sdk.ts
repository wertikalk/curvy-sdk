import { getAddress } from "viem";

import type { StarknetFeeEstimate } from "@/rpc/starknet";
import type { Currency, Network } from "@/types/api";
import { Signature } from "ethers";
import { APIClient } from "./client/client";
import { getSignatureParams as evmGetSignatureParams } from "./constants/evm";
import { getSignatureParams as starknetGetSignatureParams } from "./constants/starknet";
import { Core } from "./core";
import {
  CurvyEventEmitter,
  SCAN_COMPLETE_EVENT,
  SCAN_ERROR_EVENT,
  SCAN_MATCH_EVENT,
  SCAN_PROGRESS_EVENT,
  SYNC_COMPLETE_EVENT,
  SYNC_ERROR_EVENT,
  SYNC_PROGRESS_EVENT,
  SYNC_STARTED_EVENT,
  type ScanCompleteEvent,
  type ScanErrorEvent,
  type ScanMatchEvent,
  type SyncErrorEvent,
  type SyncProgressEvent,
  type SyncStartedEvent,
} from "./events";
import { NewMultiRPC } from "./rpc/factory";
import type MultiRPC from "./rpc/multi";
import type CurvyStealthAddress from "./stealth-address";
import { ArrayAnnouncementStorage } from "./storage/announcement-storage";
import type { AnnouncementStorageInterface } from "./storage/interface";
import type { AuthConfig, NetworkFlavour } from "./types";
import { arrayBufferToHex } from "./utils/arrayBuffer";
import { deriveAddress } from "./utils/deriveAddress";
import { computePrivateKeys } from "./utils/keyComputation";
import { type NetworkFilter, filterNetworks } from "./utils/network";
import { CurvyWallet } from "./wallet";
import { WalletManager } from "./wallet-manager";

export class CurvySDK {
  private readonly client: APIClient;
  private readonly emitter: CurvyEventEmitter;
  private readonly announcementStorage: AnnouncementStorageInterface;
  private walletManager: WalletManager;
  private networks: Network[] = [];
  public core: Core = new Core();
  public RPC: MultiRPC | undefined;

  constructor(authConfig: AuthConfig, apiBaseUrl?: string, announcementStorage?: AnnouncementStorageInterface) {
    if (!authConfig.apiKey && !authConfig.bearerToken) {
      throw new Error("Either apiKey or bearerToken must be provided");
    }
    if (authConfig.apiKey && authConfig.bearerToken) {
      throw new Error("Cannot provide both apiKey and bearerToken, choose one");
    }

    this.client = new APIClient(authConfig, apiBaseUrl);
    this.announcementStorage = announcementStorage ?? new ArrayAnnouncementStorage();
    this.emitter = new CurvyEventEmitter();
    this.walletManager = new WalletManager(this.announcementStorage, this.client, this.emitter, this.core);
  }

  public updateBearerToken(newBearerToken: string): void {
    this.client.auth.UpdateBearerToken(newBearerToken);
  }

  public async init(networkFilter: NetworkFilter | undefined, wasmUrl?: string): Promise<void> {
    this.networks = await this.client.network.GetNetworks();

    if (networkFilter === undefined) {
      await this.SetActiveNetworks(true as NetworkFilter);
    } else {
      await this.SetActiveNetworks(networkFilter);
    }

    await Core.init(wasmUrl);
    this.walletManager.StartSync();
  }

  public GetWallets(): CurvyWallet[] {
    return this.walletManager.GetWallets();
  }

  public async SyncOnce(): Promise<void> {
    await this.walletManager.SyncOnce();
  }

  public StartSync(): void {
    this.walletManager.StartSync();
  }

  public GetStealthAddress(address: string): CurvyStealthAddress | undefined {
    for (const wallet of this.GetWallets()) {
      for (const stealthAddress of wallet.stealthAddresses) {
        if (stealthAddress.address === address) {
          return stealthAddress;
        }
      }
    }
  }

  public GetNetworks(networkFilter: NetworkFilter = undefined): Network[] {
    return filterNetworks(this.networks, networkFilter);
  }

  public GetNetwork(networkFilter: NetworkFilter = undefined): Network {
    const networks = filterNetworks(this.networks, networkFilter);

    if (networks.length === 0) {
      throw new Error(`Expected exactly one, but no network found with filter ${networkFilter}`);
    }

    if (networks.length > 1) {
      throw new Error(`Expected exactly one, but more than one network found with filter ${networkFilter}`);
    }

    return networks[0];
  }

  public async GetNewStealthAddressForUser(networkIdentifier: NetworkFilter, handle: string): Promise<`0x${string}`> {
    const recipientDetails = await this.client.user.ResolveCurvyHandle(handle);
    if (!recipientDetails) {
      throw new Error(`Handle ${handle} not found`);
    }

    const { spendingKey, viewingKey } = recipientDetails.publicKeys[0];
    const {
      announcement: { recipientStealthPublicKey, ephemeralPublicKey, viewTag },
    } = this.core.send(spendingKey, viewingKey) as {
      announcement: { recipientStealthPublicKey: string; ephemeralPublicKey: string; viewTag: string };
    };

    const network = this.GetNetwork(networkIdentifier);
    const derivedAddress = deriveAddress(recipientStealthPublicKey, network.flavour);
    if (!derivedAddress) throw new Error("Couldn't derive address!");

    const response = await this.client.announcement.CreateAnnouncement({
      recipientStealthAddress: derivedAddress,
      recipientStealthPublicKey,
      network_id: network.id,
      ephemeralPublicKey,
      viewTag: viewTag,
    });

    if (response.message !== "Saved") throw new Error("Failed to register announcement");

    return derivedAddress;
  }

  public async Send(
    from: CurvyStealthAddress,
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

    return this.RPC?.Network(networkIdentifier).SendToAddress(from, toAddress, amount, currency, fee);
  }

  public async SetActiveNetworks(networkFilter: NetworkFilter) {
    const networks = this.GetNetworks(networkFilter);

    if (!networks.length) {
      throw new Error(`Network array is empty after filtering with ${networkFilter}`);
    }

    this.RPC = await NewMultiRPC(networks);
  }

  public async GetAnnouncements(query: {
    startTime?: Date;
    endTime?: Date;
    size?: number;
    offset?: number;
    networkId?: number[];
  }) {
    return this.announcementStorage.GetAnnouncements(query);
  }

  public GetNativeCurrencyForNetwork(network: Network): Currency {
    if (network.flavour === "starknet") {
      const currency = network.currencies.find(({ symbol }) => symbol === "STRK");
      if (currency) return currency;
      throw new Error(`No native currency found for network ${network.name}`);
    }

    const currency = network.currencies.find(({ contract_address }) => contract_address === undefined);
    if (!currency) throw new Error(`No native currency found for network ${network.name}`);
    return currency;
  }

  public async GetSignatureParamsForNetworkFlavour(flavour: NetworkFlavour, ownerAddress: string, password: string) {
    const encoder = new TextEncoder();
    let address = ownerAddress;

    if (flavour === "evm") {
      address = getAddress(ownerAddress);
    } else if (flavour === "starknet") {
      address = `0x${ownerAddress.replace("0x", "").padStart(64, "0")}`;
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

    if (Array.isArray(rawSignature)) {
      address = `0x${ownerAddress.replace("0x", "").padStart(64, "0")}`;
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

    const [s, v] = computePrivateKeys(sigS, sigR);
    const { S, V } = this.core.getPublicKeys(s, v);
    const keyPairs = { s, v, S, V };

    const curvyHandle = await this.client.user.GetCurvyHandleByOwnerAddress(address);
    if (!curvyHandle) throw new Error(`No Curvy handle found for owner address: ${ownerAddress}`);

    const ownerDetails = await this.client.user.ResolveCurvyHandle(curvyHandle);
    if (!ownerDetails) throw new Error(`Handle ${curvyHandle} does not exist.`);

    if (!ownerDetails.publicKeys.some(({ viewingKey: V, spendingKey: S }) => V === keyPairs.V && S === keyPairs.S))
      throw new Error(`Wrong password for handle ${curvyHandle}.`);

    const wallet = new CurvyWallet(curvyHandle, address, keyPairs);

    await this.walletManager.AddWallet(wallet);

    return wallet;
  }

  public async RefreshBalances() {
    if (!this.RPC) {
      throw new Error("RPC not initialized");
    }

    for (const wallet of this.GetWallets()) {
      for (const stealthAddress of wallet.stealthAddresses) {
        await this.RPC.GetBalances(stealthAddress);
      }
    }
  }

  public onSyncStarted(listener: (event: SyncStartedEvent) => void): void {
    this.emitter.on(SYNC_STARTED_EVENT, listener);
  }

  public onSyncProgress(listener: (event: SyncProgressEvent) => void): void {
    this.emitter.on(SYNC_PROGRESS_EVENT, listener);
  }

  public onSyncComplete(listener: (event: SyncProgressEvent) => void): void {
    this.emitter.on(SYNC_COMPLETE_EVENT, listener);
  }

  public onSyncError(listener: (event: SyncErrorEvent) => void): void {
    this.emitter.on(SYNC_ERROR_EVENT, listener);
  }

  public onScanProgress(listener: (event: ScanErrorEvent) => void): void {
    this.emitter.on(SCAN_PROGRESS_EVENT, listener);
  }

  public onScanComplete(listener: (event: ScanCompleteEvent) => void): void {
    this.emitter.on(SCAN_COMPLETE_EVENT, listener);
  }

  public onScanMatch(listener: (event: ScanMatchEvent) => void): void {
    this.emitter.on(SCAN_MATCH_EVENT, listener);
  }

  public onScanError(listener: (event: ScanErrorEvent) => void): void {
    this.emitter.on(SCAN_ERROR_EVENT, listener);
  }
}