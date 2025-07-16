import type { Announcement } from "../types";

export type AnnouncementQuery = {
  startTime?: Date;
  endTime?: Date;
  size?: number;
  offset?: number;
  networkId?: number[];
};

export type AnnouncementQueryResult = {
  announcements: Announcement[];
  total: number;
  oldestTimestamp?: Date;
  newestTimestamp?: Date;
};

export interface AnnouncementStorageInterface {
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

  // TODO: Since there are false positives, whenever we find an address
  //   holding funds for a specific announcement we should mark it and skip scanning for new wallets.
  //   This should probably be an index in the AnnouncementStorage.

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
