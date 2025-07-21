import type { IAPIClient } from "../../src/client/interface";
import type {
  Announcement,
  CreateAnnouncementParams,
  CreateAnnouncementResponse,
  GetAnnouncementsResponse,
  Network,
  ResolveUsernameResponse,
} from "../../src/types";

export class MockAPIClient implements IAPIClient {
  private announcementLimit = -1; // -1 will indicate there's no limit
  private shouldThrowError = false;

  private mockAnnouncements: Announcement[] = [];

  constructor(announcementLimit = -1, shouldThrowError = false) {
    this.announcementLimit = announcementLimit;
    this.shouldThrowError = shouldThrowError;
    // Initialize with some mock announcements
    this.generateMockAnnouncements(1000); // Generate 1000 mock announcements
  }

  CreateAnnouncement(params: CreateAnnouncementParams): Promise<CreateAnnouncementResponse> {
    throw new Error("Method not implemented.");
  }

  GetCurvyHandleByOwnerAddress(_: string): Promise<string | undefined> {
    return Promise.resolve("vitalik.curvy.name");
  }

  GetNetworks(): Promise<Network[]> {
    return Promise.resolve([
      {
        id: 1,
        name: "Mock Network",
        group: "Ethereum",
        testnet: true,
        slip0044: 60,
        flavour: "evm",
        rpcUrl: "http://localhost:8545",
        currencies: [
          {
            id: 1,
            name: "Mock Token",
            symbol: "MOCK",
            price: 1.0,
            updated_at: new Date(),
            coinmarketcap_id: "mock-token",
            decimals: 18,
            contract_address: "0x123",
          },
        ],
      },
    ]);
  }

  ResolveUsername(username: string): Promise<ResolveUsernameResponse> {
    throw new Error("Not needed for announcement syncing tests");
  }

  limitAnnouncements(limit: number): void {
    this.announcementLimit = limit;
  }

  private generateMockAnnouncements(count: number): void {
    const announcements = [];
    for (let i = 0; i < count; i++) {
      announcements.push({
        id: `announcement-${i}`,
        network_id: 1,
        recipientStealthAddress: `stealth-address-${i}`,
        recipientStealthPublicKey: `stealth-public-key-${i}`,
        ephemeralPublicKey: `ephemeral-public-key-${i}`,
        viewTag: `view-tag-${i}`,
        createdAt: new Date(Date.now() - (count - i - 1) * 60000).toISOString(), // Each announcement 1 minute apart, starting from now
        encryptedMessage: `encrypted-message-${i}`,
        encryptedMessageSenderPublicKey: `sender-public-key-${i}`,
      });
    }
    this.mockAnnouncements = announcements;
  }

  async GetAnnouncements(
    startTime: Date | undefined,
    endTime: Date | undefined,
    size: number,
  ): Promise<GetAnnouncementsResponse> {
    if (this.shouldThrowError) {
      throw new Error("Mock error");
    }

    let announcements = [...this.mockAnnouncements]; // creates a copy

    if (this.announcementLimit !== -1) {
      announcements = announcements.slice(0, this.announcementLimit);
    }

    const order = startTime && !endTime ? "ASC" : "DESC";
    if (order === "DESC") {
      announcements = announcements.reverse();
    }

    // Apply time filters if provided
    announcements = announcements.filter((a) => {
      let startTimeCriteria = true;
      let endTimeCriteria = true;

      if (startTime) {
        startTimeCriteria = new Date(a.createdAt).getTime() > startTime.getTime();
      }

      if (endTime) {
        endTimeCriteria = new Date(a.createdAt).getTime() < endTime.getTime();
      }

      return startTimeCriteria && endTimeCriteria;
    });

    return {
      announcements: announcements.slice(0, size),
      total: announcements.length,
    };
  }

  UpdateBearerToken(newBearerToken: string): void {
    // Mock implementation: does nothing
  }
  GetBearerTotp(): Promise<string> {
    throw new Error("Method not implemented.");
  }
  CreateBearerToken(body: { nonce: string; signature: string }): Promise<string> {
    throw new Error("Method not implemented.");
  }
  RefreshBearerToken(): Promise<string> {
    throw new Error("Method not implemented.");
  }
}
