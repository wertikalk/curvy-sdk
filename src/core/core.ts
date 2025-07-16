import "./wasm-exec.js";
import type { Announcement, AnnouncementBase } from "../types";

// @ts-ignore
// biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
// let curvyWasmBrowser;
// try {
//   // @ts-ignore
//   curvyWasmBrowser = await import("./curvy-core-v1.0.2.wasm?init");
// } catch (e) {
//   console.log(e);
// }

// @ts-ignore
// import curvyWasmNode from "./curvy-core-v1.0.2.wasm?init";

import { bytesToDecimalString } from "../utils/publicKeyEncoding";
import type { CurvyKeyPairs } from "./types";

declare const Go: {
  new (): {
    argv: string[];
    env: { [key: string]: string };
    exit: (code: number) => void;
    importObject: WebAssembly.Imports;
    exited: boolean;
    mem: DataView;
    run(instance: WebAssembly.Instance): void;
  };
};

declare const curvy: {
  send: (args: string) => string;
  scan: (args: string) => string;
  viewerScan: (args: string) => string;
  new_meta: () => string;
  get_meta: (args: string) => string;
  dbg_isValidBN254Point: (args: string) => boolean;
  dbg_isValidSECP256k1Point: (args: string) => boolean;
  version: () => string;
};

interface SenderInfo {
  r: string;
  R: string;
  viewTag: string;
  spendingPubKey: string;
}

export interface ScanResult {
  spendingPubKeys: string[];
  spendingPrivKeys: string[];
}

export async function loadWasm(wasmUrl?: string): Promise<void> {
  const go = new Go();

  go.importObject.gojs["runtime.wasmExit"] = (_sp: number) => {
    // simply swallow the exit
    console.warn("wasmExit called, ignoring");
  };

  const isNode = typeof process !== "undefined" && process.versions != null && process.versions.node != null;

  if (isNode) {
    // Node.js environment
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const wasmPath = path.resolve(__dirname, "./curvy-core-v1.0.2.wasm");

    const buffer = await fs.readFile(wasmUrl ?? wasmPath);
    const wasmBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;

    const instance = (await WebAssembly.instantiate(wasmBuffer, go.importObject)).instance;

    go.run(instance);
    return;
  }

  let instance: WebAssembly.Instance;
  if (wasmUrl) {
    instance = (await WebAssembly.instantiateStreaming(fetch(wasmUrl), go.importObject)).instance;
  } else {
    const { default: init } = await import(`./curvy-core-v1.0.2.wasm?init`);
    instance = await init(go.importObject);
  }
  go.run(instance);
}

export class Core {
  public static async init(wasmUrl?: string): Promise<Core> {
    await loadWasm(wasmUrl);

    return new Core();
  }

  send(S: string, V: string) {
    const input = JSON.stringify({ K: S, V });
    const result = JSON.parse(curvy.send(input)) as SenderInfo;

    return {
      announcement: {
        ephemeralPublicKey: result.R,
        viewTag: result.viewTag,
        recipientStealthPublicKey: result.spendingPubKey,
      } satisfies AnnouncementBase,
      ephemeralPrivateKey: result.r,
    };
  }

  scan(s: string, v: string, announcements: Announcement[]) {
    const formatAnnouncementsForScanning = (announcements: Announcement[]) => {
      const Rs: Array<string> = [];
      const viewTags: Array<string> = [];

      for (const announcement of announcements) {
        Rs.push(bytesToDecimalString(announcement.ephemeralPublicKey));
        viewTags.push(announcement.viewTag);
      }

      return {
        Rs,
        viewTags,
      };
    };

    const input = JSON.stringify({
      k: s,
      v,
      ...formatAnnouncementsForScanning(announcements),
    });

    const { spendingPubKeys, spendingPrivKeys } = JSON.parse(curvy.scan(input)) as ScanResult;

    return {
      spendingPubKeys: spendingPubKeys ?? [],
      spendingPrivKeys: (spendingPrivKeys ?? []).map((privKey) => `0x${privKey.slice(2).padStart(64, "0")}` as const),
    };
  }

  generateKeyPairs(): CurvyKeyPairs {
    const keyPairsRaw = curvy.new_meta();
    const keyPairs = JSON.parse(keyPairsRaw);

    return {
      s: keyPairs.k,
      S: keyPairs.K,
      v: keyPairs.v,
      V: keyPairs.V,
    } as CurvyKeyPairs;
  }

  isValidBN254Point(point: string): boolean {
    return curvy.dbg_isValidBN254Point(point);
  }

  isValidSECP256k1Point(point: string): boolean {
    return curvy.dbg_isValidSECP256k1Point(point);
  }

  getPublicKeys(s: string, v: string): CurvyKeyPairs {
    const inputs = JSON.stringify({ k: s, v });
    const result = JSON.parse(curvy.get_meta(inputs));
    return {
      s: result.k,
      v: result.v,
      S: result.K,
      V: result.V,
    } as CurvyKeyPairs;
  }

  version(): string {
    return curvy.version();
  }
}
