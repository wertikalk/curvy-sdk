import type {
  AggregationRequest,
  CreateAnnouncementParams,
  CreateAnnouncementResponse, DepositPayload,
  GetAnnouncementsResponse,
  Network,
  ResolveUsernameResponse, WithdrawPayload,
  AggregatorRequestStatus
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
  UpdateBearerToken(newBearerToken: string): void;
  GetCurvyHandleByOwnerAddress(ownerAddress: string): Promise<string | undefined>;
  SubmitDeposit(data: DepositPayload): Promise<{ requestId: string }>;
  SubmitWithdraw(data: WithdrawPayload): Promise<{ requestId: string }>;
  SubmitAggregation(data: { aggregations: AggregationRequest[] }): Promise<{ requestId: string }>;
  GetRequestStatus(requestId: string): Promise<{ requestId: string; status: AggregatorRequestStatus }>;
  GetBearerTotp(): Promise<string>;
  CreateBearerToken(body: {
    nonce: string;
    signature: string;
  }): Promise<string>;
  RefreshBearerToken(): Promise<string>;
}
