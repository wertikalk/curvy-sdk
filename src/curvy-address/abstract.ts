import type { NETWORKS, NETWORK_FLAVOUR_VALUES, TOKENS } from "@/constants/networks";
import type { CurvyAddress, CurvyAddressBalances } from "@/curvy-address/interface";
import type { ScannedAnnouncement } from "@/types";
import type { Network } from "@/types/api";

abstract class _CurvyAddress<T extends NETWORK_FLAVOUR_VALUES> implements CurvyAddress<T> {
  id: string;
  createdAt: string;

  publicKey: string;
  privateKey: string;
  ephemeralPublicKey: string;
  address: string;

  networkFlavour: T;
  network_id: number;
  viewTag: string;

  balances: CurvyAddressBalances;

  protected constructor(announcement: ScannedAnnouncement) {
    this.id = announcement.id;
    this.createdAt = announcement.createdAt;

    this.publicKey = announcement.publicKey;
    this.privateKey = announcement.privateKey;
    this.ephemeralPublicKey = announcement.ephemeralPublicKey;
    this.address = announcement.address;

    this.networkFlavour = announcement.networkFlavour as T;
    this.network_id = announcement.network_id;
    this.viewTag = announcement.viewTag;

    this.balances = Object.create(null);
  }

  abstract setBalance(
    network: Network,
    data: { symbol: string; balance: bigint; tokenAddress: string | undefined },
  ): void;

  abstract setBalances(
    network: Network,
    balances: Record<NETWORKS, Record<TOKENS, { balance: bigint; tokenAddress: string | undefined }>>,
  ): void;
}

export { _CurvyAddress };
