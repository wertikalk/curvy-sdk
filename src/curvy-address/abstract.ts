import type { NETWORKS, NETWORK_FLAVOUR_VALUES, TOKENS } from "@/constants/networks";
import type { CurvyAddress, CurvyAddressBalances } from "@/curvy-address/interface";
import type { ScannedAnnouncement } from "@/types";
import type { Network } from "@/types/api";

abstract class _CurvyAddress<T extends NETWORK_FLAVOUR_VALUES> implements CurvyAddress<T> {
  id: string;
  createdAt: string;

  publicKey: string;
  ephemeralPublicKey: string;
  address: string;

  flavour: T;
  networkId: number;

  balances: CurvyAddressBalances;

  protected constructor(announcement: ScannedAnnouncement) {
    this.id = announcement.id;
    this.createdAt = announcement.createdAt;

    this.publicKey = announcement.publicKey;
    this.ephemeralPublicKey = announcement.ephemeralPublicKey;
    this.address = announcement.address;

    this.flavour = announcement.networkFlavour as T;
    this.networkId = announcement.network_id;

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
