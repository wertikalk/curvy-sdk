import type { NETWORKS, NETWORK_FLAVOUR, NETWORK_FLAVOUR_VALUES } from "@/constants/networks";
import type { MultiRpc } from "@/rpc/multi";
import type { CurvyAddress } from "@/types/address";
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
import type { CurvySignatureParameters, EvmSignatureData, StarknetSignatureData } from "@/types/signature";
import type { NetworkFilter } from "@/utils/network";
import type { CurvyWallet } from "@/wallet";

interface ICurvySDK {
  // Getters
  get rpcClient(): MultiRpc;
  get wallets(): CurvyWallet[];
  getStealthAddressById(id: string): Promise<CurvyAddress>;
  getNetwork(networkFilter?: NetworkFilter): Network;
  getNetworks(networkFilter?: NetworkFilter): Network[];
  getNetworkByNetworkSlug(networkSlug: NETWORKS): Network | undefined;
  getNewStealthAddressForUser(networkIdentifier: NetworkFilter, handle: string): Promise<string>;
  getNativeCurrencyForNetwork(network: Network): Currency;
  getSignatureParamsForNetworkFlavour(
    flavour: NETWORK_FLAVOUR_VALUES,
    ownerAddress: string,
    password: string,
  ): Promise<CurvySignatureParameters>;

  setActiveNetworks(networkFilter: NetworkFilter): Promise<void>;

  // Actions
  addWalletWithSignature(flavour: NETWORK_FLAVOUR["EVM"], signature: EvmSignatureData): Promise<CurvyWallet>;
  addWalletWithSignature(flavour: NETWORK_FLAVOUR["STARKNET"], signature: StarknetSignatureData): Promise<CurvyWallet>;
  addWalletWithSignature(
    flavour: NETWORK_FLAVOUR_VALUES,
    signature: EvmSignatureData | StarknetSignatureData,
  ): Promise<CurvyWallet>;

  registerWalletWithSignature(
    handle: string,
    flavour: NETWORK_FLAVOUR["EVM"],
    signature: EvmSignatureData,
  ): Promise<CurvyWallet>;
  registerWalletWithSignature(
    handle: string,
    flavour: NETWORK_FLAVOUR["STARKNET"],
    signature: StarknetSignatureData,
  ): Promise<CurvyWallet>;
  registerWalletWithSignature(
    handle: string,
    flavour: NETWORK_FLAVOUR_VALUES,
    signature: EvmSignatureData | StarknetSignatureData,
  ): Promise<CurvyWallet>;

  refreshBalances(): Promise<void>;

  estimateFee(
    from: CurvyAddress,
    networkIdentifier: NetworkFilter,
    to: string,
    amount: string,
    currency: string,
  ): Promise<bigint | StarknetFeeEstimate>;
  send(
    from: CurvyAddress,
    networkIdentifier: NetworkFilter,
    to: string,
    amount: string,
    currency: string,
    fee: StarknetFeeEstimate | bigint,
  ): Promise<string>;

  // Event subscriptions
  onSyncStarted(listener: (event: SyncStartedEvent) => void): void;
  onSyncProgress(listener: (event: SyncProgressEvent) => void): void;
  onSyncComplete(listener: (event: SyncProgressEvent) => void): void;
  onSyncError(listener: (event: SyncErrorEvent) => void): void;

  onScanMatch(listener: (event: ScanMatchEvent) => void): void;
  onScanProgress(listener: (event: ScanErrorEvent) => void): void;
  onScanComplete(listener: (event: ScanCompleteEvent) => void): void;
  onScanError(listener: (event: ScanErrorEvent) => void): void;
}

export type { ICurvySDK };
