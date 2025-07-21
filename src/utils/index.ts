import { ethers } from "ethers";

function signJwtNonce(message: string, spendingPrivateKey: string): string {
  const signer = new ethers.Wallet(`0x${spendingPrivateKey}`); // Use Wallet instead of SigningKey
  const signature = signer.signingKey.sign(ethers.hashMessage(message)); // Sign the hashed nonce

  return signature.serialized;
}

export { signJwtNonce };
