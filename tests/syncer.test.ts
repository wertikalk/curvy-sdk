import {
  CurvyEventEmitter,
  SYNC_COMPLETE_EVENT,
  SYNC_ERROR_EVENT,
  SYNC_PROGRESS_EVENT,
  SYNC_STARTED_EVENT,
  type SyncCompleteEvent,
  type SyncErrorEvent,
  type SyncProgressEvent,
  type SyncStartedEvent,
} from "@/events";
import { ArrayAnnouncementStorage } from "@/storage/announcement-storage";
import { AnnouncementSyncer } from "@/syncer";
import { expect, test } from "vitest";
import { MockAPIClient } from "./mocks/mock-client";

test("should emit sync events", async () => {
  const storage = new ArrayAnnouncementStorage();
  const client = new MockAPIClient();
  const emitter = new CurvyEventEmitter();

  const syncer = new AnnouncementSyncer(storage, client, emitter);

  let totalToSync = 0;
  emitter.on(SYNC_STARTED_EVENT, (event: SyncStartedEvent) => {
    totalToSync = event.total;
  });

  emitter.on(SYNC_PROGRESS_EVENT, (event: SyncProgressEvent) => {
    expect(event.synced).toBeGreaterThanOrEqual(0);
    expect(event.synced).toBeLessThanOrEqual(totalToSync);
    progressEventReceived = true;
  });

  emitter.on(SYNC_COMPLETE_EVENT, (event: SyncCompleteEvent) => {
    expect(event.totalSynced).toEqual(totalToSync);
  });

  let progressEventReceived = false;
  await syncer.sync();
  expect(progressEventReceived).toBe(true);
});

test("should emit sync error events", async () => {
  const storage = new ArrayAnnouncementStorage();
  const client = new MockAPIClient(-1, true); // client will throw errors
  const emitter = new CurvyEventEmitter();

  const syncer = new AnnouncementSyncer(storage, client, emitter);

  let errorEventReceived = false;
  emitter.on(SYNC_ERROR_EVENT, (event: SyncErrorEvent) => {
    expect(event.error).toBeTruthy();
    errorEventReceived = true;
  });

  await expect(syncer.Start()).rejects.toThrow("Mock error");
  expect(errorEventReceived).toBe(true);
});

test("should handle progressive announcement syncing", async () => {
  const storage = new ArrayAnnouncementStorage();
  const client = new MockAPIClient();
  const emitter = new CurvyEventEmitter();

  const syncer = new AnnouncementSyncer(storage, client, emitter);

  client.limitAnnouncements(50); // Start with only 50 announcements available

  let syncStartedEvent: SyncStartedEvent;
  emitter.on(SYNC_STARTED_EVENT, (event: SyncStartedEvent) => {
    syncStartedEvent = event;
  });

  let syncCompleteEvent: SyncCompleteEvent;
  emitter.on(SYNC_COMPLETE_EVENT, (event: SyncCompleteEvent) => {
    syncCompleteEvent = event;
  });

  // Run initial sync
  await syncer.sync();

  // Verify initial sync got 50 announcements
  // @ts-ignore
  expect(syncStartedEvent.total).toBe(50);
  // @ts-ignore
  expect(syncCompleteEvent.totalSynced).toBe(50);

  // Simulate 60 more announcements becoming available
  client.limitAnnouncements(110);

  // Run subsequent sync
  await syncer.sync();

  // Verify we now have all 110 announcements
  // @ts-ignore
  expect(syncStartedEvent.total).toBe(60);
  // @ts-ignore
  expect(syncCompleteEvent.totalSynced).toBe(60);

  // Verify storage contains 100 announcements
  const announcements = await storage.GetAnnouncements({});
  expect(announcements.total).toBe(110);
});
