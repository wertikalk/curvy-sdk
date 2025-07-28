import { Address } from 'viem';

type Announcement = {
    id: string;
    networkFlavour?: NetworkFlavour;
    network_id: number;
    ephemeralPublicKey: Uint8Array | string;
    viewTag: string;
    createdAt: string;
    encryptedMessage?: string;
    encryptedMessageSenderPublicKey?: string;
    recipientStealthPublicKey: string;
};
type AnnouncementBase = {
    ephemeralPublicKey: string;
    viewTag: string;
    recipientStealthPublicKey: string;
};
type ScannedAnnouncement = Announcement & {
    recipientStealthPrivateKey?: string;
    recipientStealthAddress?: string;
    recipientStealthPublicKey?: string;
};
type NetworkFlavour = "evm" | "starknet";
type NetworkGroup = "Ethereum" | "Starknet" | "Arbitrum";
type Network = {
    id: number;
    name: string;
    group: NetworkGroup;
    testnet: boolean;
    slip0044: number;
    flavour: NetworkFlavour;
    multiCallContractAddress?: string;
    chainId?: string;
    blockExplorerUrl?: string;
    currencies: Currency[];
    rpcUrl: string;
};
type Currency = {
    id: number;
    name: string;
    symbol: string;
    price: number;
    updated_at: Date;
    icon_url?: string;
    coinmarketcap_id: string;
    decimals: number;
    contract_address?: string;
};
type User = {
    id?: string;
    handle: string;
    ownerAddress: string;
    publicKeys?: Array<PublicKey>;
    createdAt?: Date;
};
type PublicKey = {
    spendingKey: string;
    viewingKey: string;
};
type CreateAnnouncementParams = {
    ephemeralPublicKey: string;
    network_id: number;
    recipientStealthAddress: string;
    recipientStealthPublicKey: string;
    viewTag: string;
};
type CreateAnnouncementResponse = {
    data?: {
        id: string;
        message: string;
    };
    error?: string | null;
};
type ResolveUsernameResponse = {
    createdAt: string;
    publicKeys: Array<PublicKey>;
} | null;
type GetAnnouncementsResponse = {
    announcements: Announcement[];
    total: number;
};
type GetUsernameByOwnerAddressResponse = {
    handle: string | undefined;
};
type AuthConfig = {
    apiKey?: string;
    bearerToken?: string;
};

type AnnouncementQuery = {
    startTime?: Date;
    endTime?: Date;
    size?: number;
    offset?: number;
    networkId?: number[];
};
type AnnouncementQueryResult = {
    announcements: Announcement[];
    total: number;
    oldestTimestamp?: Date;
    newestTimestamp?: Date;
};
interface AnnouncementStorageInterface {
    /**
     * Writes a single announcement to storage.
     * @throws {StorageError} If the announcement is invalid or write fails
     */
    WriteAnnouncement(announcement: Announcement): Promise<void>;
    /**
     * Writes multiple announcements to storage in a batch.
     * @throws {StorageError} If any announcement is invalid or write fails
     */
    WriteManyAnnouncements(announcements: Announcement[]): Promise<void>;
    /**
     * Retrieves announcements based on query parameters.
     * @throws {StorageError} If the query fails
     */
    GetAnnouncements(query?: AnnouncementQuery): Promise<AnnouncementQueryResult>;
    /**
     * Gets the timestamp of the earliest announcement in storage.
     * @returns {Promise<Date>} The timestamp or 1970-01-01 if storage is empty
     * @throws {StorageError} If the query fails
     */
    GetEarliestTimestamp(): Promise<Date | undefined>;
    /**
     * Gets the timestamp of the latest announcement in storage.
     * @returns {Promise<Date>} The timestamp or 1970-01-01 if storage is empty
     * @throws {StorageError} If the query fails
     */
    GetLatestTimestamp(): Promise<Date | undefined>;
}

// Copyright 2018 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.


(() => {
  const enosys = () => {
    const err = new Error("not implemented");
    err.code = "ENOSYS";
    return err;
  };

  if (!globalThis.fs) {
    let outputBuf = "";
    globalThis.fs = {
      constants: { O_WRONLY: -1, O_RDWR: -1, O_CREAT: -1, O_TRUNC: -1, O_APPEND: -1, O_EXCL: -1, O_DIRECTORY: -1 }, // unused
      writeSync(fd, buf) {
        outputBuf += decoder.decode(buf);
        const nl = outputBuf.lastIndexOf("\n");
        if (nl != -1) {
          console.log(outputBuf.substring(0, nl));
          outputBuf = outputBuf.substring(nl + 1);
        }
        return buf.length;
      },
      write(fd, buf, offset, length, position, callback) {
        if (offset !== 0 || length !== buf.length || position !== null) {
          callback(enosys());
          return;
        }
        const n = this.writeSync(fd, buf);
        callback(null, n);
      },
      chmod(path, mode, callback) {
        callback(enosys());
      },
      chown(path, uid, gid, callback) {
        callback(enosys());
      },
      close(fd, callback) {
        callback(enosys());
      },
      fchmod(fd, mode, callback) {
        callback(enosys());
      },
      fchown(fd, uid, gid, callback) {
        callback(enosys());
      },
      fstat(fd, callback) {
        callback(enosys());
      },
      fsync(fd, callback) {
        callback(null);
      },
      ftruncate(fd, length, callback) {
        callback(enosys());
      },
      lchown(path, uid, gid, callback) {
        callback(enosys());
      },
      link(path, link, callback) {
        callback(enosys());
      },
      lstat(path, callback) {
        callback(enosys());
      },
      mkdir(path, perm, callback) {
        callback(enosys());
      },
      open(path, flags, mode, callback) {
        callback(enosys());
      },
      read(fd, buffer, offset, length, position, callback) {
        callback(enosys());
      },
      readdir(path, callback) {
        callback(enosys());
      },
      readlink(path, callback) {
        callback(enosys());
      },
      rename(from, to, callback) {
        callback(enosys());
      },
      rmdir(path, callback) {
        callback(enosys());
      },
      stat(path, callback) {
        callback(enosys());
      },
      symlink(path, link, callback) {
        callback(enosys());
      },
      truncate(path, length, callback) {
        callback(enosys());
      },
      unlink(path, callback) {
        callback(enosys());
      },
      utimes(path, atime, mtime, callback) {
        callback(enosys());
      },
    };
  }

  if (!globalThis.process) {
    globalThis.process = {
      getuid() {
        return -1;
      },
      getgid() {
        return -1;
      },
      geteuid() {
        return -1;
      },
      getegid() {
        return -1;
      },
      getgroups() {
        throw enosys();
      },
      pid: -1,
      ppid: -1,
      umask() {
        throw enosys();
      },
      cwd() {
        throw enosys();
      },
      chdir() {
        throw enosys();
      },
    };
  }

  if (!globalThis.path) {
    globalThis.path = {
      resolve(...pathSegments) {
        return pathSegments.join("/");
      },
    };
  }

  if (!globalThis.crypto) {
    throw new Error("globalThis.crypto is not available, polyfill required (crypto.getRandomValues only)");
  }

  if (!globalThis.performance) {
    throw new Error("globalThis.performance is not available, polyfill required (performance.now only)");
  }

  if (!globalThis.TextEncoder) {
    throw new Error("globalThis.TextEncoder is not available, polyfill required");
  }

  if (!globalThis.TextDecoder) {
    throw new Error("globalThis.TextDecoder is not available, polyfill required");
  }

  const encoder = new TextEncoder("utf-8");
  const decoder = new TextDecoder("utf-8");

  globalThis.Go = class {
    constructor() {
      this.argv = ["js"];
      this.env = {};
      this.exit = (code) => {
        if (code !== 0) {
          console.warn("exit code:", code);
        }
      };
      this._exitPromise = new Promise((resolve) => {
        this._resolveExitPromise = resolve;
      });
      this._pendingEvent = null;
      this._scheduledTimeouts = new Map();
      this._nextCallbackTimeoutID = 1;

      const setInt64 = (addr, v) => {
        this.mem.setUint32(addr + 0, v, true);
        this.mem.setUint32(addr + 4, Math.floor(v / 4294967296), true);
      };

      const getInt64 = (addr) => {
        const low = this.mem.getUint32(addr + 0, true);
        const high = this.mem.getInt32(addr + 4, true);
        return low + high * 4294967296;
      };

      const loadValue = (addr) => {
        const f = this.mem.getFloat64(addr, true);
        if (f === 0) {
          return undefined;
        }
        if (!isNaN(f)) {
          return f;
        }

        const id = this.mem.getUint32(addr, true);
        return this._values[id];
      };

      const storeValue = (addr, v) => {
        const nanHead = 0x7ff80000;

        if (typeof v === "number" && v !== 0) {
          if (isNaN(v)) {
            this.mem.setUint32(addr + 4, nanHead, true);
            this.mem.setUint32(addr, 0, true);
            return;
          }
          this.mem.setFloat64(addr, v, true);
          return;
        }

        if (v === undefined) {
          this.mem.setFloat64(addr, 0, true);
          return;
        }

        let id = this._ids.get(v);
        if (id === undefined) {
          id = this._idPool.pop();
          if (id === undefined) {
            id = this._values.length;
          }
          this._values[id] = v;
          this._goRefCounts[id] = 0;
          this._ids.set(v, id);
        }
        this._goRefCounts[id]++;
        let typeFlag = 0;
        switch (typeof v) {
          case "object":
            if (v !== null) {
              typeFlag = 1;
            }
            break;
          case "string":
            typeFlag = 2;
            break;
          case "symbol":
            typeFlag = 3;
            break;
          case "function":
            typeFlag = 4;
            break;
        }
        this.mem.setUint32(addr + 4, nanHead | typeFlag, true);
        this.mem.setUint32(addr, id, true);
      };

      const loadSlice = (addr) => {
        const array = getInt64(addr + 0);
        const len = getInt64(addr + 8);
        return new Uint8Array(this._inst.exports.mem.buffer, array, len);
      };

      const loadSliceOfValues = (addr) => {
        const array = getInt64(addr + 0);
        const len = getInt64(addr + 8);
        const a = new Array(len);
        for (let i = 0; i < len; i++) {
          a[i] = loadValue(array + i * 8);
        }
        return a;
      };

      const loadString = (addr) => {
        const saddr = getInt64(addr + 0);
        const len = getInt64(addr + 8);
        return decoder.decode(new DataView(this._inst.exports.mem.buffer, saddr, len));
      };

      const testCallExport = (a, b) => {
        this._inst.exports.testExport0();
        return this._inst.exports.testExport(a, b);
      };

      const timeOrigin = Date.now() - performance.now();
      this.importObject = {
        _gotest: {
          add: (a, b) => a + b,
          callExport: testCallExport,
        },
        gojs: {
          // Go's SP does not change as long as no Go code is running. Some operations (e.g. calls, getters and setters)
          // may synchronously trigger a Go event handler. This makes Go code get executed in the middle of the imported
          // function. A goroutine can switch to a new stack if the current stack is too small (see morestack function).
          // This changes the SP, thus we have to update the SP used by the imported function.

          // func wasmExit(code int32)
          "runtime.wasmExit": (sp) => {
            sp >>>= 0;
            const code = this.mem.getInt32(sp + 8, true);
            this.exited = true;
            delete this._inst;
            delete this._values;
            delete this._goRefCounts;
            delete this._ids;
            delete this._idPool;
            this.exit(code);
          },

          // func wasmWrite(fd uintptr, p unsafe.Pointer, n int32)
          "runtime.wasmWrite": (sp) => {
            sp >>>= 0;
            const fd = getInt64(sp + 8);
            const p = getInt64(sp + 16);
            const n = this.mem.getInt32(sp + 24, true);
            fs.writeSync(fd, new Uint8Array(this._inst.exports.mem.buffer, p, n));
          },

          // func resetMemoryDataView()
          "runtime.resetMemoryDataView": (sp) => {
            this.mem = new DataView(this._inst.exports.mem.buffer);
          },

          // func nanotime1() int64
          "runtime.nanotime1": (sp) => {
            sp >>>= 0;
            setInt64(sp + 8, (timeOrigin + performance.now()) * 1000000);
          },

          // func walltime() (sec int64, nsec int32)
          "runtime.walltime": (sp) => {
            sp >>>= 0;
            const msec = new Date().getTime();
            setInt64(sp + 8, msec / 1000);
            this.mem.setInt32(sp + 16, (msec % 1000) * 1000000, true);
          },

          // func scheduleTimeoutEvent(delay int64) int32
          "runtime.scheduleTimeoutEvent": (sp) => {
            sp >>>= 0;
            const id = this._nextCallbackTimeoutID;
            this._nextCallbackTimeoutID++;
            this._scheduledTimeouts.set(
              id,
              setTimeout(
                () => {
                  this._resume();
                  while (this._scheduledTimeouts.has(id)) {
                    // for some reason Go failed to register the timeout event, log and try again
                    // (temporary workaround for https://github.com/golang/go/issues/28975)
                    console.warn("scheduleTimeoutEvent: missed timeout event");
                    this._resume();
                  }
                },
                getInt64(sp + 8),
              ),
            );
            this.mem.setInt32(sp + 16, id, true);
          },

          // func clearTimeoutEvent(id int32)
          "runtime.clearTimeoutEvent": (sp) => {
            sp >>>= 0;
            const id = this.mem.getInt32(sp + 8, true);
            clearTimeout(this._scheduledTimeouts.get(id));
            this._scheduledTimeouts.delete(id);
          },

          // func getRandomData(r []byte)
          "runtime.getRandomData": (sp) => {
            sp >>>= 0;
            crypto.getRandomValues(loadSlice(sp + 8));
          },

          // func finalizeRef(v ref)
          "syscall/js.finalizeRef": (sp) => {
            sp >>>= 0;
            const id = this.mem.getUint32(sp + 8, true);
            this._goRefCounts[id]--;
            if (this._goRefCounts[id] === 0) {
              const v = this._values[id];
              this._values[id] = null;
              this._ids.delete(v);
              this._idPool.push(id);
            }
          },

          // func stringVal(value string) ref
          "syscall/js.stringVal": (sp) => {
            sp >>>= 0;
            storeValue(sp + 24, loadString(sp + 8));
          },

          // func valueGet(v ref, p string) ref
          "syscall/js.valueGet": (sp) => {
            sp >>>= 0;
            const result = Reflect.get(loadValue(sp + 8), loadString(sp + 16));
            sp = this._inst.exports.getsp() >>> 0; // see comment above
            storeValue(sp + 32, result);
          },

          // func valueSet(v ref, p string, x ref)
          "syscall/js.valueSet": (sp) => {
            sp >>>= 0;
            Reflect.set(loadValue(sp + 8), loadString(sp + 16), loadValue(sp + 32));
          },

          // func valueDelete(v ref, p string)
          "syscall/js.valueDelete": (sp) => {
            sp >>>= 0;
            Reflect.deleteProperty(loadValue(sp + 8), loadString(sp + 16));
          },

          // func valueIndex(v ref, i int) ref
          "syscall/js.valueIndex": (sp) => {
            sp >>>= 0;
            storeValue(sp + 24, Reflect.get(loadValue(sp + 8), getInt64(sp + 16)));
          },

          // valueSetIndex(v ref, i int, x ref)
          "syscall/js.valueSetIndex": (sp) => {
            sp >>>= 0;
            Reflect.set(loadValue(sp + 8), getInt64(sp + 16), loadValue(sp + 24));
          },

          // func valueCall(v ref, m string, args []ref) (ref, bool)
          "syscall/js.valueCall": (sp) => {
            sp >>>= 0;
            try {
              const v = loadValue(sp + 8);
              const m = Reflect.get(v, loadString(sp + 16));
              const args = loadSliceOfValues(sp + 32);
              const result = Reflect.apply(m, v, args);
              sp = this._inst.exports.getsp() >>> 0; // see comment above
              storeValue(sp + 56, result);
              this.mem.setUint8(sp + 64, 1);
            } catch (err) {
              sp = this._inst.exports.getsp() >>> 0; // see comment above
              storeValue(sp + 56, err);
              this.mem.setUint8(sp + 64, 0);
            }
          },

          // func valueInvoke(v ref, args []ref) (ref, bool)
          "syscall/js.valueInvoke": (sp) => {
            sp >>>= 0;
            try {
              const v = loadValue(sp + 8);
              const args = loadSliceOfValues(sp + 16);
              const result = Reflect.apply(v, undefined, args);
              sp = this._inst.exports.getsp() >>> 0; // see comment above
              storeValue(sp + 40, result);
              this.mem.setUint8(sp + 48, 1);
            } catch (err) {
              sp = this._inst.exports.getsp() >>> 0; // see comment above
              storeValue(sp + 40, err);
              this.mem.setUint8(sp + 48, 0);
            }
          },

          // func valueNew(v ref, args []ref) (ref, bool)
          "syscall/js.valueNew": (sp) => {
            sp >>>= 0;
            try {
              const v = loadValue(sp + 8);
              const args = loadSliceOfValues(sp + 16);
              const result = Reflect.construct(v, args);
              sp = this._inst.exports.getsp() >>> 0; // see comment above
              storeValue(sp + 40, result);
              this.mem.setUint8(sp + 48, 1);
            } catch (err) {
              sp = this._inst.exports.getsp() >>> 0; // see comment above
              storeValue(sp + 40, err);
              this.mem.setUint8(sp + 48, 0);
            }
          },

          // func valueLength(v ref) int
          "syscall/js.valueLength": (sp) => {
            sp >>>= 0;
            setInt64(sp + 16, parseInt(loadValue(sp + 8).length));
          },

          // valuePrepareString(v ref) (ref, int)
          "syscall/js.valuePrepareString": (sp) => {
            sp >>>= 0;
            const str = encoder.encode(String(loadValue(sp + 8)));
            storeValue(sp + 16, str);
            setInt64(sp + 24, str.length);
          },

          // valueLoadString(v ref, b []byte)
          "syscall/js.valueLoadString": (sp) => {
            sp >>>= 0;
            const str = loadValue(sp + 8);
            loadSlice(sp + 16).set(str);
          },

          // func valueInstanceOf(v ref, t ref) bool
          "syscall/js.valueInstanceOf": (sp) => {
            sp >>>= 0;
            this.mem.setUint8(sp + 24, loadValue(sp + 8) instanceof loadValue(sp + 16) ? 1 : 0);
          },

          // func copyBytesToGo(dst []byte, src ref) (int, bool)
          "syscall/js.copyBytesToGo": (sp) => {
            sp >>>= 0;
            const dst = loadSlice(sp + 8);
            const src = loadValue(sp + 32);
            if (!(src instanceof Uint8Array || src instanceof Uint8ClampedArray)) {
              this.mem.setUint8(sp + 48, 0);
              return;
            }
            const toCopy = src.subarray(0, dst.length);
            dst.set(toCopy);
            setInt64(sp + 40, toCopy.length);
            this.mem.setUint8(sp + 48, 1);
          },

          // func copyBytesToJS(dst ref, src []byte) (int, bool)
          "syscall/js.copyBytesToJS": (sp) => {
            sp >>>= 0;
            const dst = loadValue(sp + 8);
            const src = loadSlice(sp + 16);
            if (!(dst instanceof Uint8Array || dst instanceof Uint8ClampedArray)) {
              this.mem.setUint8(sp + 48, 0);
              return;
            }
            const toCopy = src.subarray(0, dst.length);
            dst.set(toCopy);
            setInt64(sp + 40, toCopy.length);
            this.mem.setUint8(sp + 48, 1);
          },

          debug: (value) => {
            console.log(value);
          },
        },
      };
    }

    async run(instance) {
      if (!(instance instanceof WebAssembly.Instance)) {
        throw new Error("Go.run: WebAssembly.Instance expected");
      }
      this._inst = instance;
      this.mem = new DataView(this._inst.exports.mem.buffer);
      this._values = [
        // JS values that Go currently has references to, indexed by reference id
        NaN,
        0,
        null,
        true,
        false,
        globalThis,
        this,
      ];
      this._goRefCounts = new Array(this._values.length).fill(Infinity); // number of references that Go has to a JS value, indexed by reference id
      this._ids = new Map([
        // mapping from JS values to reference ids
        [0, 1],
        [null, 2],
        [true, 3],
        [false, 4],
        [globalThis, 5],
        [this, 6],
      ]);
      this._idPool = []; // unused ids that have been garbage collected
      this.exited = false; // whether the Go program has exited

      // Pass command line arguments and environment variables to WebAssembly by writing them to the linear memory.
      let offset = 4096;

      const strPtr = (str) => {
        const ptr = offset;
        const bytes = encoder.encode(str + "\0");
        new Uint8Array(this.mem.buffer, offset, bytes.length).set(bytes);
        offset += bytes.length;
        if (offset % 8 !== 0) {
          offset += 8 - (offset % 8);
        }
        return ptr;
      };

      const argc = this.argv.length;

      const argvPtrs = [];
      this.argv.forEach((arg) => {
        argvPtrs.push(strPtr(arg));
      });
      argvPtrs.push(0);

      const keys = Object.keys(this.env).sort();
      keys.forEach((key) => {
        argvPtrs.push(strPtr(`${key}=${this.env[key]}`));
      });
      argvPtrs.push(0);

      const argv = offset;
      argvPtrs.forEach((ptr) => {
        this.mem.setUint32(offset, ptr, true);
        this.mem.setUint32(offset + 4, 0, true);
        offset += 8;
      });

      // The linker guarantees global data starts from at least wasmMinDataAddr.
      // Keep in sync with cmd/link/internal/ld/data.go:wasmMinDataAddr.
      const wasmMinDataAddr = 4096 + 8192;
      if (offset >= wasmMinDataAddr) {
        throw new Error("total length of command line and environment variables exceeds limit");
      }

      this._inst.exports.run(argc, argv);
      if (this.exited) {
        this._resolveExitPromise();
      }
      await this._exitPromise;
    }

    _resume() {
      if (this.exited) {
        throw new Error("Go program has already exited");
      }
      this._inst.exports.resume();
      if (this.exited) {
        this._resolveExitPromise();
      }
    }

    _makeFuncWrapper(id) {
      const go = this;
      return function () {
        const event = { id: id, this: this, args: arguments };
        go._pendingEvent = event;
        go._resume();
        return event.result;
      };
    }
  };
})();

type CurvyKeyPairs = {
    s: string;
    S: string;
    v: string;
    V: string;
};

declare class Core {
    static init(wasmUrl?: string): Promise<Core>;
    send(S: string, V: string): {
        announcement: {
            ephemeralPublicKey: string;
            viewTag: string;
            recipientStealthPublicKey: string;
        };
        ephemeralPrivateKey: string;
    };
    scan(s: string, v: string, announcements: Announcement[]): {
        spendingPubKeys: string[];
        spendingPrivKeys: `0x${string}`[];
    };
    generateKeyPairs(): CurvyKeyPairs;
    isValidBN254Point(point: string): boolean;
    isValidSECP256k1Point(point: string): boolean;
    getPublicKeys(s: string, v: string): CurvyKeyPairs;
    version(): string;
}

declare namespace Types$1 {
    enum SupportedNetwork {
        ETHEREUM_SEPOLIA = "ethereum-sepolia"
    }
    enum SupportedNetworkId {
        ETHEREUM_SEPOLIA = 1
    }
    enum SupportedNetworkChainId {
        ETHEREUM_SEPOLIA = "11155111"
    }
    enum ActionSet {
        TRANSFER = "transfer",
        WITHDRAW = "withdraw",
        DEPOSIT_TO_AGGREGATOR = "deposit-to-aggregator"
    }
    namespace APIClient {
        type GetCSAInfoRequest = {
            network: SupportedNetwork | SupportedNetworkId;
            csas: string[];
        };
        type GetCSAInfoResponse = {
            csaInfo: CSAInfo[];
        };
        type GetActionEstimatedCostRequest = {
            payloads: ActionPayload[];
        };
        type GetActionEstimatedCostResponse = {
            estimatedCosts: EstimatedActionCost[];
        };
        type CreateActionRequest = {
            actions: Action[];
        };
        type CreateActionResponse = {
            actionStatuses: ActionStatus[];
        };
    }
    type ActionType = {
        service: "CSUC";
        type: ActionSet;
    };
    type ActionPayload = {
        id?: number;
        network: SupportedNetwork;
        networkId: number;
        from: string;
        actionType: ActionType;
        encodedData: string;
        createdAt: Date;
    };
    type EstimatedActionCost = {
        payload: ActionPayload;
        offeredTotalFee: string;
        explanation: string;
    };
    type Action = {
        id?: string;
        payload: ActionPayload;
        totalFee: string;
        signature: Signature;
        createdAt?: Date;
    };
    type Signature = {
        curve: "secp256k1";
        hash: string;
        r: string;
        s: string;
        v: string;
    };
    enum ActionStage {
        INVALID = "INVALID",
        ACCEPTED = "ACCEPTED",
        BATCHED = "BATCHED",
        FINALIZED = "FINALIZED"
    }
    type ActionStatus = {
        id: string;
        stage: ActionStage;
        estimatedInclusionTime: Date;
        batchId: string;
    };
    enum BatchStage {
        WAITING = "WAITING",
        FULL = "FULL",
        SUBMITTED = "SUBMITTED",
        REVERTED = "REVERTED",
        FINALIZED = "FINALIZED"
    }
    type Batch = {
        id: string;
        network: Network;
        stage: BatchStage;
        actionIds: string[];
        onChainHash: string;
        onChainCallParameters: any;
        onChainCost: string;
        createdAt: Date;
        updatedAt: Date;
    };
    type CSAInfo = {
        network: SupportedNetwork;
        address: string;
        balances: Balance[];
        nonce: Nonce[];
    };
    type Balance = {
        token: string;
        amount: string;
    };
    type Nonce = {
        token: string;
        value: string;
    };
}

declare namespace types {
  export { Types$1 as Types };
}

declare namespace Utils {
    const PrepareActionEstimationRequest: (network: Types$1.SupportedNetwork, action: Types$1.ActionSet, from: CurvyStealthAddress, to: Address | string, token: Address, amount: string | bigint) => Promise<Types$1.ActionPayload>;
    const PrepareActionRequest: (network: Types$1.SupportedNetwork, from: CurvyStealthAddress, payload: Types$1.ActionPayload, totalFee: string) => Promise<Types$1.Action>;
    const assertNetworkIsSupported: (network: Types$1.SupportedNetwork) => Promise<void>;
    const supportedNetworkToChainId: (network: Types$1.SupportedNetwork) => Types$1.SupportedNetworkChainId;
    namespace EVM {
        const hashActionPayload: (chainId: string, payload: Types$1.ActionPayload, totalFee: string, nonce: string) => string;
        const getOnchainActionId: (payload: Types$1.ActionPayload) => bigint;
        const signActionPayload: (chainId: string, payload: Types$1.ActionPayload, totalFee: string, nonce: string, privateKey: `0x${string}`) => Promise<Types$1.Signature>;
        namespace Token {
            const parseDecimals: (value: bigint | string | number, decimals?: number) => bigint;
            const getTokenAddress: (networkId: string, tokenSymbol: string) => string | undefined;
            const getTokenSymbol: (network: Types$1.SupportedNetwork, tokenAddress: string) => string | undefined;
        }
    }
}

declare const utils_Utils: typeof Utils;
declare namespace utils {
  export { utils_Utils as Utils };
}

declare class CSUC {
    balances: Record<string, bigint>;
    nonces: Record<string, bigint>;
    SetCSAInfo(network: Network, balances: Types$1.Balance[], nonces: Types$1.Nonce[]): void;
    getNonce(network: Types$1.SupportedNetwork, tokenSymbol: string): bigint;
}

declare class CurvyStealthAddress {
    privateKey: string;
    publicKey: string;
    address: string;
    flavour?: NetworkFlavour;
    networkId: number;
    balances: Record<string, bigint>;
    CSUC: CSUC;
    constructor(privateKey: string, publicKey: string, networkId: number, flavour: NetworkFlavour | undefined);
    constructor();
    static fromAddress(address: string): CurvyStealthAddress;
    SetBalance(currency: string, balance: bigint): void;
    SetBalances(network: Network, balances: Record<string, bigint>): void;
}

declare class CurvyWallet {
    private readonly keyPairs;
    private ownerAddress;
    private curvyHandle;
    stealthAddresses: CurvyStealthAddress[];
    constructor(curvyHandle: string | undefined, ownerAddress: string | undefined, keyPairs: CurvyKeyPairs);
    GetKeyPairs(): CurvyKeyPairs;
    GetOwnerAddress(): string | undefined;
    GetCurvyHandle(): string | undefined;
    AddStealthAddress(stealthAddress: CurvyStealthAddress): void;
}

type SyncStartedEvent = {
    total: number;
};
type SyncProgressEvent = {
    synced: number;
    announcements: Announcement[];
    remaining: number;
};
type SyncCompleteEvent = {
    totalSynced: number;
};
type SyncErrorEvent = {
    error: Error;
};
declare const SYNC_STARTED_EVENT = "sync-started";
declare const SYNC_PROGRESS_EVENT = "sync-progress";
declare const SYNC_COMPLETE_EVENT = "sync-complete";
declare const SYNC_ERROR_EVENT = "sync-error";
type ScanProgressEvent = {
    scanned: number;
    wallet: CurvyWallet;
    total: number;
};
type ScanCompleteEvent = {
    scanned: number;
    matched: number;
    wallet: CurvyWallet;
    total: number;
};
type ScanMatchEvent = {
    wallet: CurvyWallet;
    stealthAddress: CurvyStealthAddress;
};
type ScanErrorEvent = {
    wallet: CurvyWallet;
    error: Error;
};
declare const SCAN_PROGRESS_EVENT = "scan-progress";
declare const SCAN_COMPLETE_EVENT = "scan-complete";
declare const SCAN_MATCH_EVENT = "scan-match";
declare const SCAN_ERROR_EVENT = "scan-error";

type NetworkFilter = string | string[] | number | number[] | ((network: Network) => boolean) | boolean | undefined;
declare function filterNetworks(networks: Network[], networkFilter: NetworkFilter): Network[];

declare abstract class RPC {
    protected network: Network;
    constructor(network: Network);
    Network(): Network;
    abstract init(): void;
    abstract GetBalances(stealthAddress: CurvyStealthAddress): Promise<Record<string, bigint>>;
    abstract SendToAddress(stealthAddress: CurvyStealthAddress, address: string, amount: string, currency: string, fee?: any): Promise<string>;
    abstract EstimateFee(stealthAddress: CurvyStealthAddress, address: Address, amount: string, currency: string): Promise<any>;
    abstract FeeToAmount(feeEstimate: any): bigint;
    abstract CreateReferenceToERC20(token: Address): Promise<any>;
    abstract CreateReferenceToCSUC(): Promise<any>;
}

declare class MultiRPC {
    private rpcs;
    constructor(rpcs: RPC[]);
    GetBalances(stealthAddress: CurvyStealthAddress): Promise<Record<string, bigint>>;
    Network(networkFilter: NetworkFilter): RPC;
    CreateReferenceToERC20(stealthAddress: CurvyStealthAddress, token: any): Promise<any>;
    CreateReferenceToCSUC(stealthAddress: CurvyStealthAddress): Promise<any>;
}

declare namespace Types {
    namespace APIClient {
        type CreateRequest = {
            actions: Action[];
        };
        type Response = {
            actionIds: string[];
        };
    }
    type Action = {
        id?: string;
        networkId: number;
        payloads: ActionPayload[];
        signedPayloads: string[];
    };
    type ActionPayload = {
        data: string;
    };
    enum ActionStatus {
        INVALID = "INVALID",
        ACCEPTED = "ACCEPTED",
        BATCHED = "BATCHED",
        FINALIZED = "FINALIZED"
    }
    type OnchainData = {
        fundingTxHash: string;
        fundingTxBlockHash?: string | null;
        approveTxHash: string;
        approveTxBlockHash?: string | null;
        csucWrappedTxHash: string;
        csucWrappedTxBlockHash?: string | null;
    };
}

declare class CurvySDK {
    private readonly client;
    private networks;
    private readonly announcementStorage;
    private readonly emitter;
    private syncer;
    private scanner;
    core: Core;
    RPC: MultiRPC | undefined;
    constructor(authConfig: AuthConfig, apiBaseUrl?: string, announcementStorage?: AnnouncementStorageInterface);
    updateBearerToken(newBearerToken: string): void;
    init(networkFilter: NetworkFilter | undefined, wasmUrl?: string): Promise<void>;
    GetNetworkAndCurrencyFromBalanceIdentifier(balanceIdentifier: `${string}:${string}`): [Network, Currency] | undefined;
    GetWallets(): CurvyWallet[];
    GetStealthAddress(address: string): CurvyStealthAddress | undefined;
    GetNetworks(networkFilter?: NetworkFilter): Network[];
    GetNetwork(networkFilter?: NetworkFilter): Network;
    GetNewStealthAddressForUser(networkIdentifier: NetworkFilter, handle: string): Promise<`0x${string}`>;
    Send(from: CurvyStealthAddress, networkIdentifier: NetworkFilter, to: string, amount: string, currency: string, fee: unknown): Promise<string | undefined>;
    SetActiveNetworks(networkFilter: NetworkFilter): Promise<void>;
    GetAnnouncements(query: {
        startTime?: Date;
        endTime?: Date;
        size?: number;
        offset?: number;
        networkId?: number[];
    }): Promise<AnnouncementQueryResult>;
    GetNativeCurrencyForNetwork(network: Network): Currency;
    GetSignatureParamsForNetworkFlavour(flavour: NetworkFlavour, ownerAddress: string, password: string): Promise<{
        domain: {
            name: string;
            chainId: string;
            version: string;
            revision: string;
        };
        primaryType: string;
        types: {
            Simple: {
                name: string;
                type: string;
            }[];
            StarknetDomain: {
                name: string;
                type: string;
            }[];
        };
        message: {
            title: string;
            content: string;
        };
    } | {
        domain: {
            name: string;
            version: string;
            chainId: number;
        };
        message: {
            title: string;
            content: string;
        };
        primaryType: string;
        types: {
            EIP712Domain: {
                name: string;
                type: string;
            }[];
            AuthMessage: {
                name: string;
                type: string;
            }[];
        };
    }>;
    AddWalletWithSignature(ownerAddress: string, rawSignature: `0x${string}` | string[]): Promise<CurvyWallet>;
    Utils(): {
        CSUC: typeof Utils;
    };
    RefreshBalances(): Promise<void>;
    OnboardToCSUC(from: CurvyStealthAddress, to: Address | string, token: Address | string, amount: bigint | string): Promise<Types.APIClient.Response>;
    EstimateActionInsideCSUC(network: Types$1.SupportedNetwork, actionId: Types$1.ActionSet, from: CurvyStealthAddress, to: Address | string, token: Address, amount: bigint | string): Promise<Types$1.EstimatedActionCost>;
    RequestActionInsideCSUC(network: Types$1.SupportedNetwork, from: CurvyStealthAddress, payload: Types$1.ActionPayload, totalFee: string): Promise<Types$1.ActionStatus>;
    onSyncStarted(listener: (event: SyncStartedEvent) => void): void;
    onSyncProgress(listener: (event: SyncProgressEvent) => void): void;
    onSyncComplete(listener: (event: SyncProgressEvent) => void): void;
    onSyncError(listener: (event: SyncErrorEvent) => void): void;
    onScanProgress(listener: (event: ScanErrorEvent) => void): void;
    onScanComplete(listener: (event: ScanCompleteEvent) => void): void;
    onScanMatch(listener: (event: ScanMatchEvent) => void): void;
    onScanError(listener: (event: ScanErrorEvent) => void): void;
}

declare const init: (authConfig: AuthConfig, apiBaseUrl?: string, networkFilter?: NetworkFilter, wasmUrl?: string) => Promise<CurvySDK>;

declare class CurvyError extends Error {
    code: string;
    constructor(message: string, code: string);
}
declare class AnnouncementSyncError extends CurvyError {
    originalError?: Error | undefined;
    constructor(message: string, originalError?: Error | undefined);
}
declare class StorageError extends CurvyError {
    originalError?: Error | undefined;
    constructor(message: string, originalError?: Error | undefined);
}
declare class APIError extends CurvyError {
    statusCode?: number | undefined;
    responseBody?: unknown | undefined;
    constructor(message: string, statusCode?: number | undefined, responseBody?: unknown | undefined);
}

export { APIError, type Announcement, type AnnouncementBase, AnnouncementSyncError, type AuthConfig, CSUC, type CreateAnnouncementParams, type CreateAnnouncementResponse, type Currency, CurvyError, CurvySDK, CurvyWallet, type GetAnnouncementsResponse, type GetUsernameByOwnerAddressResponse, type Network, type NetworkFilter, type NetworkFlavour, type NetworkGroup, type PublicKey, type ResolveUsernameResponse, SCAN_COMPLETE_EVENT, SCAN_ERROR_EVENT, SCAN_MATCH_EVENT, SCAN_PROGRESS_EVENT, SYNC_COMPLETE_EVENT, SYNC_ERROR_EVENT, SYNC_PROGRESS_EVENT, SYNC_STARTED_EVENT, type ScanCompleteEvent, type ScanErrorEvent, type ScanMatchEvent, type ScanProgressEvent, type ScannedAnnouncement, StorageError, type SyncCompleteEvent, type SyncErrorEvent, type SyncProgressEvent, type SyncStartedEvent, types as TypesCSUC, type User, utils as UtilsCSUC, filterNetworks, init };
