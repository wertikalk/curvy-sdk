export type Announcement = {
  id: string; // Required for deduplication
  networkFlavour?: NetworkFlavour; // Required to differentiate between address types
  network_id: number;
  ephemeralPublicKey: Uint8Array | string;
  viewTag: string;
  createdAt: string; // Required for cursor-based syncing
  encryptedMessage?: string;
  encryptedMessageSenderPublicKey?: string;
  recipientStealthPublicKey: string;
};

export type AnnouncementBase = {
  ephemeralPublicKey: string;
  viewTag: string;
  recipientStealthPublicKey: string;
};

export type ScannedAnnouncement = Announcement & {
  recipientStealthPrivateKey?: string;
  recipientStealthAddress?: string;
  recipientStealthPublicKey?: string;
};

export type NetworkFlavour = "evm" | "starknet";
export type NetworkGroup = "Ethereum" | "Starknet" | "Arbitrum";

export type Network = {
  id: number;
  name: string;
  group: NetworkGroup;
  testnet: boolean;
  slip0044: number;
  flavour: NetworkFlavour;
  multiCallContractAddress?: string;
  chainId?: string;
  blockExplorerUrl?: string;
  currencies: Currency[];
  rpcUrl: string;
};

export type Currency = {
  id: number;
  name: string;
  symbol: string;
  price: number;
  updated_at: Date;
  icon_url?: string;
  coinmarketcap_id: string;
  decimals: number;
  contract_address?: string;
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

export type CreateAnnouncementParams = {
  ephemeralPublicKey: string;
  network_id: number;
  recipientStealthAddress: string;
  recipientStealthPublicKey: string;
  viewTag: string;
};
export type CreateAnnouncementResponse = { id: string; message: string };

export type ResolveUsernameResponse = {
  createdAt: string;
  publicKeys: Array<PublicKey>;
} | null;

export type GetAnnouncementsResponse = {
  announcements: Announcement[];
  total: number;
};

export type GetUsernameByOwnerAddressResponse = {
  handle: string | undefined;
};

export type DepositPayload = {
  outputNotes: OutputNoteData[];
  csucAddress: string;
  csucTransferAllowanceSignature: string;
};

export type WithdrawPayload = {
  inputNotes: InputNoteData[];
  signatures: Signature[];
  destinationAddress: string;
};

export type Aggregation = {
  inputNotes: InputNoteData[];
  outputNotes: OutputNoteData[];
  signatures: Signature[];
  ephemeralKeys: bigint[];
};

export type AggregationPayload = {
  aggregations: Aggregation[];
};

export type InputNoteData = {
  owner: {
    ownerBabyJub: bigint[];
    sharedSecret: bigint;
  };
  token: bigint;
  amount: bigint;
};

export type Signature = {
  S: bigint;
  R8: bigint[];
};

export type OutputNoteData = {
  ownerHash: bigint;
  amount: bigint;
  token: bigint;
};

export type AggregationRequest = {
  id?: string;
  isDummy: boolean;
  userId: string;
  ephemeralKeys: bigint[];
  inputNotesData: InputNoteData[];
  outputNotesData: OutputNoteData[];
  outputSignatures: Signature[];
  aggregationGroupId: string;
};

export type AggregatorRequestStatus =
  | 'pending'
  | 'submitting'
  | 'success'
  | 'failed'
  | 'cancelled';