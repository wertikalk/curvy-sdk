import { expect, test } from "vitest";
import { Core } from "../src/core/core";
import { CurvyEventEmitter, SCAN_MATCH_EVENT, type ScanMatchEvent } from "../src/events";
import AnnouncementScanner from "../src/scanner";
import { ArrayAnnouncementStorage } from "../src/storage/announcement-storage";
import { CurvyWallet } from "../src/wallet";
import { mockPopulateAnnouncement } from "./utils/announcement-filler";

test("should have one scanner match", async () => {
  const storage = new ArrayAnnouncementStorage();
  const emitter = new CurvyEventEmitter();

  const core = await Core.init();

  const scanner = new AnnouncementScanner(storage, core, emitter);

  // Create new keyPairs and a wallet
  const keyPairs = core.generateKeyPairs();
  const wallet = new CurvyWallet(undefined, undefined, keyPairs);

  // Create a new stealth address for the wallet and write to storage
  const { announcement } = core.send(keyPairs.S, keyPairs.V);
  await storage.WriteAnnouncement(mockPopulateAnnouncement(announcement));

  let scanMatchEventReceived = false;
  emitter.on(SCAN_MATCH_EVENT, (event: ScanMatchEvent) => {
    scanMatchEventReceived = true;
  });

  // Register the wallet with the scanner
  await scanner.AddWallet(wallet);

  // Expect the scan match to occur
  expect(scanMatchEventReceived).toBe(true);
});
