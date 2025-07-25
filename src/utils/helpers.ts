import { NETWORK_ENVIRONMENT, assertSupportedNetwork } from "@/constants/networks";
import type { Network } from "@/types/api";
import { ethers } from "ethers";

const isNode = typeof process !== "undefined" && process.versions != null && process.versions.node != null;
const textEncoder = new TextEncoder();

const networkGroupToSlug = (network: Network) => {
  const group = network.group.toLowerCase();
  assertSupportedNetwork(group);

  return `${group}-${network.testnet ? NETWORK_ENVIRONMENT.TESTNET : NETWORK_ENVIRONMENT.MAINNET}`;
};

function toSlug(str: string) {
  return str.replace(" ", "-").toLowerCase();
}

const signJwtNonce = (message: string, spendingPrivateKey: string): string => {
  const signer = new ethers.Wallet(`0x${spendingPrivateKey}`); // Use Wallet instead of SigningKey
  const signature = signer.signingKey.sign(ethers.hashMessage(message));

  return signature.serialized;
};

const sha256Digest = async (message: string, outputLength: number | undefined = undefined): Promise<string> => {
  const hash = await crypto.subtle.digest("SHA-256", textEncoder.encode(message));
  return Buffer.from(hash).toString("hex").slice(0, undefined);
};

const WALLET_ID_LENGTH = 12;
const generateWalletId = (s: string, v: string) => {
  return sha256Digest(JSON.stringify({ s, v }), WALLET_ID_LENGTH);
};

function arrayBufferToHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function encode(message: string) {
  return textEncoder.encode(message);
}

export {
  isNode,
  networkGroupToSlug,
  signJwtNonce,
  sha256Digest,
  generateWalletId,
  textEncoder,
  toSlug,
  arrayBufferToHex,
  encode,
};
