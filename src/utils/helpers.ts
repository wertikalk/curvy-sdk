import { NETWORK_ENVIRONMENT, assertSupportedNetwork } from "@/constants/networks";
import type { Network } from "@/types/api";
import { ethers } from "ethers";

const isNode = typeof process !== "undefined" && process.versions != null && process.versions.node != null;

const networkGroupToSlug = (network: Network) => {
  const group = network.group.toLowerCase();
  assertSupportedNetwork(group);

  return `${group}-${network.testnet ? NETWORK_ENVIRONMENT.TESTNET : NETWORK_ENVIRONMENT.MAINNET}`;
};

const signJwtNonce = (message: string, spendingPrivateKey: string): string => {
  const signer = new ethers.Wallet(`0x${spendingPrivateKey}`); // Use Wallet instead of SigningKey
  const signature = signer.signingKey.sign(ethers.hashMessage(message));

  return signature.serialized;
};

export { isNode, networkGroupToSlug, signJwtNonce };
