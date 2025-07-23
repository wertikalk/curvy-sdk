import type {
    CreateAnnouncementParams,
    CreateAnnouncementResponse,
    GetAnnouncementsResponse,
    Network,
    ResolveUsernameResponse,
    GasSponsorship,
    CreateGasSponsorshipRequest,
    GetCSAInfoOnCSUCRequest,
    // GetCSAInfoOnCSUCResponse,
} from "../types";

export interface IAPIClient {
    GetAnnouncements(
        startTime: Date | undefined,
        endTime: Date | undefined,
        size: number
    ): Promise<GetAnnouncementsResponse>;
    CreateAnnouncement(
        params: CreateAnnouncementParams
    ): Promise<CreateAnnouncementResponse>;
    GetNetworks(): Promise<Network[]>;
    ResolveUsername(username: string): Promise<ResolveUsernameResponse>;
    UpdateBearerToken(newBearerToken: string): void;
    GetCurvyHandleByOwnerAddress(
        ownerAddress: string
    ): Promise<string | undefined>;
    SubmitGasSponsorshipRequest(
        req: CreateGasSponsorshipRequest
    ): Promise<GasSponsorship.ActionStatus>;

    GetCSAInfoOnCSUC(req: GetCSAInfoOnCSUCRequest): Promise<any>;
}
