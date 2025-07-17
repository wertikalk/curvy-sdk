import type { NetworkFlavour, NetworkGroup, PublicKey } from "@/types/index";

//#region API Types

//////////////////////////////////////////////////////////////////////////////
//
// API Types
//
//////////////////////////////////////////////////////////////////////////////

type _Announcement = {
  createdAt: string;
  id: string;
  networkFlavour: NetworkFlavour;
  network_id: number;
  viewTag: string;
};

type RawAnnoucement = _Announcement & {
  ephemeralPublicKey: string;
};

type Currency = {
  id: number;
  name: string;
  symbol: string;
  coinmarketcap_id: string;
  icon_url: string;
  price: number;
  updated_at: string;
  decimals: number;
  contract_address?: string;
};

type RawNetwork = {
  id: number;
  name: string;
  group: NetworkGroup;
  testnet: boolean;
  slip0044: number;
  flavour: NetworkFlavour;
  multiCallContractAddress: string;
  chainId: string;
  blockExplorerUrl: string;
};

type RawNetworkWithCurrencies = RawNetwork & {
  currencies: Array<Currency>;
};

//#endregion

//#region API Client Types

//////////////////////////////////////////////////////////////////////////////
//
// API Client Types
//
//////////////////////////////////////////////////////////////////////////////

//#region Announcement
type CreateAnnouncementRequestBody = {
  ephemeralPublicKey: string;
  network_id: number;
  recipientStealthAddress: string;
  recipientStealthPublicKey: string;
  viewTag: string;
};
type CreateAnnouncementReturnType = { id: string; message: string };

type GetAnnouncementsResponse = {
  announcements: Array<RawAnnoucement>;
  total: number;
};
type OptimizedAnnouncement = _Announcement & {
  ephemeralPublicKey: Uint8Array;
};
type GetAnnouncementsReturnType = {
  announcements: Array<RawAnnoucement>;
  total: number;
};

type UpdateAnnouncementEncryptedMessageRequestBody = {
  encryptedMessage: string;
  encryptedMessageSenderPublicKey: string;
};
type UpdateAnnouncementEncryptedMessageReturnType = {
  message?: string;
};

type GetAnnouncementEncryptedMessageRequestBody = {
  id: string;
};
type GetAnnouncementEncryptedMessageReturnType = {
  encryptedMessage: string;
  encryptedMessageSenderPublicKey: string;
};

//#endregion

//#region Network
type Network = RawNetworkWithCurrencies & {
  rpcUrl: string;
};

type NetworksWithCurrenciesResponse = Array<RawNetworkWithCurrencies>;
type GetNetworksReturnType = Array<Network>;
//#endregion

//#region User
type RegisterCurvyHandleRequestBody = {
  handle: string;
  ownerAddress: string;
  publicKeys: Array<{
    spendingKey: string;
    viewingKey: string;
  }>;
};
type RegisterCurvyHandleReturnType = {
  message?: string;
};
type ResolveCurvyHandleReturnType = {
  createdAt: string;
  publicKeys: Array<PublicKey>;
} | null;
type GetCurvyHandleByOwnerAddressResponse = {
  handle: string;
} | null;
type GetCurvyHandleByOwnerAddressReturnType = string | null;
//#endregion

export type {
  CreateAnnouncementRequestBody,
  CreateAnnouncementReturnType,
  GetAnnouncementsResponse,
  GetAnnouncementsReturnType,
  RawAnnoucement,
  OptimizedAnnouncement,
  UpdateAnnouncementEncryptedMessageRequestBody,
  UpdateAnnouncementEncryptedMessageReturnType,
  GetAnnouncementEncryptedMessageRequestBody,
  GetAnnouncementEncryptedMessageReturnType,
  Network,
  Currency,
  NetworksWithCurrenciesResponse,
  GetNetworksReturnType,
  RegisterCurvyHandleRequestBody,
  RegisterCurvyHandleReturnType,
  ResolveCurvyHandleReturnType,
  GetCurvyHandleByOwnerAddressResponse,
  GetCurvyHandleByOwnerAddressReturnType,
};

//#endregion
