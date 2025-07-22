type ExtractKeys<T> = T extends { [key: string]: unknown } ? keyof T : never;
type ExtractValues<T> = T extends { [key: string]: unknown } ? T[keyof T] : never;
type Prettify<T> = { [key in keyof T]: T[key] } & unknown;

type HexString = `0x${string}`;
const isHexString = (value: unknown): value is HexString => {
  return typeof value === "string" && /^0x[0-9a-fA-F]*$/.test(value);
};

export type { ExtractKeys, ExtractValues, HexString, Prettify };
export { isHexString };
