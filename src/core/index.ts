import "./wasm-exec.js";

import type { RawAnnoucement } from "@/types/api";
import type {
  CoreLegacyKeyPairs,
  CoreScanArgs,
  CoreScanReturnType,
  CoreSendReturnType,
  CurvyKeyPairs,
} from "@/types/core";
import { isNode } from "@/utils/helpers";

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

async function loadWasm(wasmUrl?: string): Promise<void> {
  const go = new Go();

  go.importObject.gojs["runtime.wasmExit"] = (_sp: number) => {
    console.warn("wasmExit called, ignoring");
  };

  if (isNode) {
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
    const { default: init } = await import("./curvy-core-v1.0.2.wasm?init");
    instance = await init(go.importObject);
  }
  go.run(instance);
}

class Core {
  public static async init(wasmUrl?: string): Promise<Core> {
    await loadWasm(wasmUrl);

    return new Core();
  }

  private prepareScanArgs(s: string, v: string, announcements: RawAnnoucement[]): CoreScanArgs {
    const Rs: Array<string> = [];
    const viewTags: Array<string> = [];

    for (const announcement of announcements) {
      Rs.push(announcement.ephemeralPublicKey);
      viewTags.push(announcement.viewTag);
    }

    return {
      k: s,
      v,
      Rs,
      viewTags,
    } satisfies CoreScanArgs;
  }

  generateKeyPairs(): CurvyKeyPairs {
    const keyPairs: CoreLegacyKeyPairs = JSON.parse(curvy.new_meta());

    return {
      s: keyPairs.k,
      S: keyPairs.K,
      v: keyPairs.v,
      V: keyPairs.V,
    } satisfies CurvyKeyPairs;
  }

  getPublicKeys(s: string, v: string): CurvyKeyPairs {
    const inputs = JSON.stringify({ k: s, v });
    const result: CoreLegacyKeyPairs = JSON.parse(curvy.get_meta(inputs));
    return {
      s: result.k,
      v: result.v,
      S: result.K,
      V: result.V,
    } satisfies CurvyKeyPairs;
  }

  send(S: string, V: string) {
    const input = JSON.stringify({ K: S, V });
    const result: CoreSendReturnType = JSON.parse(curvy.send(input));

    return {
      announcement: {
        ephemeralPublicKey: result.R,
        viewTag: result.viewTag,
        recipientStealthPublicKey: result.spendingPubKey,
      },
      ephemeralPrivateKey: result.r,
    };
  }

  scan(s: string, v: string, announcements: RawAnnoucement[]) {
    const input = JSON.stringify(this.prepareScanArgs(s, v, announcements));

    const { spendingPubKeys, spendingPrivKeys }: CoreScanReturnType = JSON.parse(curvy.scan(input));

    return {
      spendingPubKeys: spendingPubKeys ?? [],
      spendingPrivKeys: (spendingPrivKeys ?? []).map((pk) => `0x${pk.slice(2).padStart(64, "0")}` as const),
    };
  }

  isValidBN254Point(point: string): boolean {
    return curvy.dbg_isValidBN254Point(point);
  }

  isValidSECP256k1Point(point: string): boolean {
    return curvy.dbg_isValidSECP256k1Point(point);
  }

  version(): string {
    return curvy.version();
  }
}

export { Core };
