import { computeAddress } from "ethers";
import { CallData, hash, validateAndParseAddress } from "starknet";
import type { Address } from "viem";
import { CURVY_ACCOUNT_CLASS_HASHES } from "../constants/starknet";
import { starknetAccountAbi } from "../contracts/starknet/abi/account";
import type { NetworkFlavour } from "../types";
import { decimalStringToHex } from "./publicKeyEncoding";

export const deriveAddress = (rawPubKey?: string, flavour?: NetworkFlavour) => {
  if (!rawPubKey || !flavour) {
    return "";
  }

  const pubKey = decimalStringToHex(rawPubKey, false);

  switch (flavour) {
    case "starknet": {
      const myCallData = new CallData(starknetAccountAbi);

      const constructorCalldata = myCallData.compile("constructor", {
        public_key: pubKey,
      });
      const salt = "0x3327";

      const address = hash.calculateContractAddressFromHash(
        salt,
        CURVY_ACCOUNT_CLASS_HASHES[CURVY_ACCOUNT_CLASS_HASHES.length - 1],
        constructorCalldata,
        0,
      );
      return validateAndParseAddress(address) as Address;
    }
    case "evm": {
      return computeAddress(pubKey) as Address;
    }
  }
};
