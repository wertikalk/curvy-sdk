import type {
    CreateAnnouncementParams,
    CreateAnnouncementResponse,
    GetAnnouncementsResponse,
    Network,
    ResolveUsernameResponse,
} from "../types";

import { IAPIClient as IAPIClientForCSUC } from "../features/csuc";
import { IAPIClient as IAPIClientForGasSponsorhip } from "../features/gas-sponsorship";

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

    CSUC: IAPIClientForCSUC;
    GasSponsorship: IAPIClientForGasSponsorhip;
}
