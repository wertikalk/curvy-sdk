export function arrayBufferToHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

const textEncoder = new TextEncoder();

export function encode(message: string) {
  return textEncoder.encode(message);
}
