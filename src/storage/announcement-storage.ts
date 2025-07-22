import { StorageError } from "@/errors";
import type { OptimizedAnnouncement, RawAnnoucement } from "@/types/api";
import { bytesToDecimalString, decimalStringToBytes } from "@/utils/publicKeyEncoding";
import type { AnnouncementQuery, AnnouncementQueryResult, AnnouncementStorageInterface } from "./interface";

export class ArrayAnnouncementStorage implements AnnouncementStorageInterface {
  private announcements: Map<string, OptimizedAnnouncement> = new Map();
  private earliestTimestamp: Date | undefined;
  private latestTimestamp: Date | undefined;

  async WriteAnnouncement(announcement: RawAnnoucement): Promise<void> {
    try {
      if (!announcement.id || !announcement.createdAt) {
        // noinspection ExceptionCaughtLocallyJS
        throw new StorageError("Invalid announcement: missing id or createdAt");
      }

      const timestamp = new Date(announcement.createdAt);

      if (!this.earliestTimestamp || timestamp < this.earliestTimestamp) {
        this.earliestTimestamp = timestamp;
      }

      if (!this.latestTimestamp || timestamp > this.latestTimestamp) {
        this.latestTimestamp = timestamp;
      }

      const optimizedAnnouncement = {
        ...announcement,
        ephemeralPublicKey: decimalStringToBytes(announcement.ephemeralPublicKey),
      } satisfies OptimizedAnnouncement;

      this.announcements.set(announcement.id, optimizedAnnouncement);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError("Failed to write announcement", error as Error);
    }
  }

  async WriteManyAnnouncements(announcements: RawAnnoucement[]): Promise<void> {
    try {
      for (const announcement of announcements) {
        await this.WriteAnnouncement(announcement);
      }
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError("Failed to write announcements batch", error as Error);
    }
  }

  async GetAnnouncements(query: AnnouncementQuery = {}): Promise<AnnouncementQueryResult> {
    try {
      let filtered = Array.from(this.announcements.values());

      if (query.startTime) {
        filtered = filtered.filter((a) => query.startTime && new Date(a.createdAt) > query.startTime);
      }

      if (query.endTime) {
        filtered = filtered.filter((a) => query.endTime && new Date(a.createdAt) < query.endTime);
      }

      if (query.networkId?.length) {
        filtered = filtered.filter((a) => query.networkId?.includes(a.network_id));
      }

      const total = filtered.length;
      const size = query.size ?? 200;
      const offset = query.offset ?? 0;

      filtered = filtered.slice(offset, offset + size);

      const oldestTimestamp = filtered.length ? new Date(filtered[filtered.length - 1].createdAt) : undefined;

      const latestTimestamp = filtered.length ? new Date(filtered[0].createdAt) : undefined;

      // TODO: Think about the returned object, why oldest & newwest?
      return {
        announcements: filtered.map((announcement) => ({
          ...announcement,
          ephemeralPublicKey: bytesToDecimalString(announcement.ephemeralPublicKey),
        })),
        total,
        oldestTimestamp,
        latestTimestamp,
      };
    } catch (error) {
      throw new StorageError("Failed to query announcements", error as Error);
    }
  }

  async GetEarliestTimestamp(): Promise<Date | undefined> {
    return this.earliestTimestamp;
  }

  async GetLatestTimestamp(): Promise<Date | undefined> {
    return this.latestTimestamp;
  }
}
