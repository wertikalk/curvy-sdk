import type { RawAnnoucement } from "@/types/api";

export type ScannedAnnouncement = RawAnnoucement & {
  publicKey: string;
  walletId: string;
  address: string;
};

export type AnnouncementBase = {
  ephemeralPublicKey: string;
  viewTag: string;
  recipientStealthPublicKey: string;
};

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
