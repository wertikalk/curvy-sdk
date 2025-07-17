import type { AnnouncementBase } from "@/types";
import type { RawAnnoucement } from "@/types/api";

let mockIdCounter = 1;

export function mockPopulateAnnouncement(announcement: AnnouncementBase): RawAnnoucement {
  return {
    ...announcement,
    id: (mockIdCounter++).toString(),
    createdAt: new Date().toString(),
    network_id: 1,
    networkFlavour: "evm" as const,
  };
}
