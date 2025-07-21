import type {
  CreateAnnouncementParams,
  CreateAnnouncementResponse,
  GetAnnouncementsResponse,
  Network,
  ResolveUsernameResponse,
} from "../types";

export interface IAPIClient {
  GetAnnouncements(
    startTime: Date | undefined,
    endTime: Date | undefined,
    size: number,
  ): Promise<GetAnnouncementsResponse>;
  CreateAnnouncement(params: CreateAnnouncementParams): Promise<CreateAnnouncementResponse>;
  GetNetworks(): Promise<Network[]>;
  ResolveUsername(username: string): Promise<ResolveUsernameResponse>;
  GetCurvyHandleByOwnerAddress(ownerAddress: string): Promise<string | undefined>;
  UpdateBearerToken(newBearerToken: string): void;
  GetBearerTotp(): Promise<string>;
  CreateBearerToken(body: {
    nonce: string;
    signature: string;
  }): Promise<string>;
  RefreshBearerToken(): Promise<string>;
}
