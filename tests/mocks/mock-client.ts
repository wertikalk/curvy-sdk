import type { IAPIClient } from "@/client/interface";
import type {
  CreateAnnouncementRequestBody,
  CreateAnnouncementReturnType,
  GetAnnouncementEncryptedMessageReturnType,
  GetAnnouncementsReturnType,
  GetCurvyHandleByOwnerAddressReturnType,
  GetNetworksReturnType,
  RawAnnoucement,
  RegisterCurvyHandleRequestBody,
  RegisterCurvyHandleReturnType,
  ResolveCurvyHandleReturnType,
  UpdateAnnouncementEncryptedMessageRequestBody,
  UpdateAnnouncementEncryptedMessageReturnType,
} from "@/types/api";

export class MockAPIClient implements IAPIClient {
  private announcementLimit = -1; // -1 will indicate there's no limit
  private shouldThrowError = false;

  private mockAnnouncements: RawAnnoucement[] = [];

  constructor(announcementLimit = -1, shouldThrowError = false) {
    this.announcementLimit = announcementLimit;
    this.shouldThrowError = shouldThrowError;
    // Initialize with some mock announcements
    this.generateMockAnnouncements(1000); // Generate 1000 mock announcements
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
        networkFlavour: "evm" as const,
        ephemeralPublicKey: `123${i}.456${i}`,
        viewTag: `view-tag-${i}`,
        createdAt: new Date(Date.now() - (count - i - 1) * 60000).toISOString(), // Each announcement 1 minute apart, starting from now
      });
    }
    this.mockAnnouncements = announcements;
  }

  announcement = {
    CreateAnnouncement: async (params: CreateAnnouncementRequestBody): Promise<CreateAnnouncementReturnType> => {
      throw new Error("Method not implemented.");
    },
    GetAnnouncements: async (
      startTime: Date | undefined,
      endTime: Date | undefined,
      size: number,
    ): Promise<GetAnnouncementsReturnType> => {
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
        // @ts-ignore
        announcements: announcements.slice(0, size),
        total: announcements.length,
      };
    },
    UpdateAnnouncementEncryptedMessage: async (
      id: string,
      body: UpdateAnnouncementEncryptedMessageRequestBody,
    ): Promise<UpdateAnnouncementEncryptedMessageReturnType> => {
      throw new Error("Method not implemented.");
    },
    GetAnnouncementEncryptedMessage: async (id: string): Promise<GetAnnouncementEncryptedMessageReturnType> => {
      throw new Error("Method not implemented.");
    },
  };
  network = {
    GetNetworks: async (): Promise<GetNetworksReturnType> => {
      return Promise.resolve([
        {
          id: 1,
          name: "Mock Network",
          group: "Ethereum",
          testnet: true,
          slip0044: 60,
          flavour: "evm",
          rpcUrl: "http://localhost:8545",
          multiCallContractAddress: "0x0",
          chainId: "1",
          blockExplorerUrl: "https://etherscan.io",
          currencies: [
            {
              id: 1,
              name: "Mock Token",
              symbol: "MOCK",
              icon_url: "",
              price: 1.0,
              updated_at: "2025-07-17T10:33:30.384Z",
              coinmarketcap_id: "mock-token",
              decimals: 18,
              contract_address: "0x123",
            },
          ],
        },
      ]);
    },
  };
  auth = {
    UpdateBearerToken: (newBearerToken: string): void => {
      // Mock implementation: does nothing
    },
    GetBearerTotp: async (): Promise<string> => {
      throw new Error("Method not implemented!");
    },
    CreateBearerToken: async (body: { nonce: string; signature: string }): Promise<string> => {
      throw new Error("Method not implemented!");
    },
    RefreshBearerToken: async (): Promise<string> => {
      throw new Error("Method not implemented!");
    },
  };
  user = {
    GetCurvyHandleByOwnerAddress: async (_: string): Promise<GetCurvyHandleByOwnerAddressReturnType> => {
      return Promise.resolve("vitalik.curvy.name");
    },

    ResolveCurvyHandle: async (username: string): Promise<ResolveCurvyHandleReturnType> => {
      throw new Error("Not needed for announcement syncing tests");
    },

    RegisterCurvyHandle: async (body: RegisterCurvyHandleRequestBody): Promise<RegisterCurvyHandleReturnType> => {
      throw new Error("Not needed for announcement syncing tests");
    },
  };
}
