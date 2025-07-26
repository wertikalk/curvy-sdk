import { NETWORK_FLAVOUR, type NETWORK_FLAVOUR_VALUES } from "@/constants/networks";
import { CURVY_ACCOUNT_CLASS_HASHES } from "@/constants/starknet";
import { starknetAccountAbi } from "@/contracts/starknet/abi/account";
import type { HexString } from "@/types/helper";
import { computeAddress } from "ethers";
import { CallData, hash, validateAndParseAddress } from "starknet";
import { decimalStringToHex } from "./decimal-conversions";

export const deriveAddress = (rawPubKey?: string, flavour?: NETWORK_FLAVOUR_VALUES) => {
  if (!rawPubKey || !flavour) {
    throw new Error("Couldn't derive address! Missing public key or network flavour.");
  }

  const pubKey = decimalStringToHex(rawPubKey, false);

  switch (flavour) {
    case NETWORK_FLAVOUR.STARKNET: {
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
      return validateAndParseAddress(address) as HexString;
    }
    case NETWORK_FLAVOUR.EVM: {
      return computeAddress(pubKey) as HexString;
    }
  }
};
