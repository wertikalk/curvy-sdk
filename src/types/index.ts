import type { RawAnnoucement } from "@/types/api";

export type ScannedAnnouncement = RawAnnoucement & {
  recipientStealthPrivateKey: string;
  recipientStealthAddress: string;
  recipientStealthPublicKey: string;
};

export type AnnouncementBase = {
  ephemeralPublicKey: string;
  viewTag: string;
  recipientStealthPublicKey: string;
};

export type NetworkFlavour = "evm" | "starknet";
export type NetworkGroup = "Ethereum" | "Starknet" | "Arbitrum";

export type User = {
  id?: string;
  handle: string;
  ownerAddress: string;
  publicKeys?: Array<PublicKey>;
  createdAt?: Date;
};

export type PublicKey = {
  spendingKey: string;
  viewingKey: string;
};

export type AuthConfig = {
  apiKey?: string;
  bearerToken?: string;
};
