import type { Announcement, AnnouncementBase } from "../../src/types";

let mockIdCounter = 1;

export function mockPopulateAnnouncement(announcement: AnnouncementBase): Announcement {
  return { ...announcement, id: (mockIdCounter++).toString(), createdAt: new Date().toString(), network_id: 1 };
}
