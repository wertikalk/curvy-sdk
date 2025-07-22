//#region API Types

//////////////////////////////////////////////////////////////////////////////
//
// API Types
//
//////////////////////////////////////////////////////////////////////////////

import type { NETWORK_FLAVOUR_VALUES, NETWORK_GROUP_VALUES } from "@/constants/networks";

type _Announcement = {
  createdAt: string;
  id: string;
  networkFlavour: NETWORK_FLAVOUR_VALUES;
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
  group: NETWORK_GROUP_VALUES;
  testnet: boolean;
  slip0044: number;
  flavour: NETWORK_FLAVOUR_VALUES;
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
type CreateAnnouncementReturnType = {
  data?: {
    id: string;
    message: string;
  };
  error?: string | null;
};

type GetAnnouncementsResponse = {
  data: { announcements: Array<RawAnnoucement>; total: number };
  error: string | null;
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
  data?: {
    encryptedMessage: string;
    encryptedMessageSenderPublicKey: string;
  };
  error?: string | null;
};

type GetAnnouncementEncryptedMessageReturnType = {
  data?: {
    message?: string;
  };
  error?: string | null;
};

//#endregion

//#region Network

type Network = RawNetworkWithCurrencies & {
  rpcUrl: string;
};

type NetworksWithCurrenciesResponse = { data: Array<RawNetworkWithCurrencies>; error: string | null };
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
type RegisterCurvyHandleReturnType =
  | {
      message?: string;
    }
  | {
      error?: string;
    };
type ResolveCurvyHandleReturnType = {
  data: {
    createdAt: string;
    publicKeys: Array<{
      spendingKey: string;
      viewingKey: string;
    }>;
  } | null;
  error?: string | null;
};
type GetCurvyHandleByOwnerAddressResponse = {
  data: {
    handle: string;
  } | null;
  error?: string | null;
};
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
