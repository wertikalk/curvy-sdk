// -------------------------------- Legacy

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
export type CreateAnnouncementResponse = {
    data?: { id: string; message: string };
    error?: string | null;
};

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

export type AuthConfig = {
    apiKey?: string;
    bearerToken?: string;
};
