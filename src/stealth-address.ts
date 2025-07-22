import type { NETWORKS, TOKENS } from "@/constants/networks";
import type { NetworkFlavour, ScannedAnnouncement } from "@/types";
import type { Network } from "@/types/api";
import { toSlug } from "./utils/slug";

export default class CurvyStealthAddress {
  id: string;
  createdAt: string;

  publicKey: string;
  ephemeralPublicKey: string;
  address: string;

  flavour: NetworkFlavour;
  networkId: number;

  balances: Record<NETWORKS, Record<TOKENS, { balance: bigint; tokenAddress: string | undefined }>>;

  constructor(announcement: ScannedAnnouncement) {
    this.id = announcement.id;
    this.createdAt = announcement.createdAt;

    this.publicKey = announcement.publicKey;
    this.ephemeralPublicKey = announcement.ephemeralPublicKey;
    this.address = announcement.address;

    this.flavour = announcement.networkFlavour;
    this.networkId = announcement.network_id;

    this.balances = Object.create(null);
  }

  public SetBalance(symbol: string, balance: bigint): void {
    this.balances[symbol] = balance;
  }

  public SetBalances(network: Network, balances: Record<string, bigint>): void {
    for (const currency in balances) {
      this.balances[`${toSlug(network.name)}:${currency}`] = balances[currency];
    }
  }
}
