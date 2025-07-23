import { concat, keccak256 } from "ethers";

export const computePrivateKeys = (_s: bigint, _r: bigint) => {
  const [s, v] = [hash([_s, _r]), hash([_r, _s])];

  if (s === v) throw new Error("Error generating keys: k === v !");

  return { s, v };
};

export const hash = (_values: bigint[]) => {
  const values = _values.map((v) => `0x${v.toString(16).length % 2 === 0 ? v.toString(16) : `0${v.toString(16)}`}`);
  const MAX_OUTPUT_LENGTH = 252;
  const MIN_OUTPUT_LENGTH = 180;
  const MIN_VALID_VALUE = 10n ** 70n;

  const preImage = concat(values);
  const hashed = keccak256(preImage).replace("0x", "").slice(1);

  if (hashed.length * 4 > MAX_OUTPUT_LENGTH)
    throw new Error(`Error generating hash: length over ${MAX_OUTPUT_LENGTH} bits`);

  if (hashed.length * 4 < MIN_OUTPUT_LENGTH)
    throw new Error(`Error generating hash: length under ${MIN_OUTPUT_LENGTH} bits`);

  if (BigInt(`0x${hashed}`) < MIN_VALID_VALUE)
    throw new Error(`Error generating hash: hashed value under ${MIN_VALID_VALUE}`);

  return `0${hashed.padStart(MAX_OUTPUT_LENGTH / 4, "0")}`;
};
