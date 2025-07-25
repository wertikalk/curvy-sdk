import type {
  CreateAnnouncementRequestBody,
  CreateAnnouncementReturnType,
  GetAnnouncementEncryptedMessageReturnType,
  GetAnnouncementsReturnType,
  GetCurvyHandleByOwnerAddressReturnType,
  GetNetworksReturnType,
  RegisterCurvyHandleRequestBody,
  RegisterCurvyHandleReturnType,
  ResolveCurvyHandleReturnType,
  UpdateAnnouncementEncryptedMessageRequestBody,
  UpdateAnnouncementEncryptedMessageReturnType,
} from "@/types/api";

interface IApiClient {
  updateBearerToken(newBearerToken: string): void;

  announcement: {
    CreateAnnouncement(body: CreateAnnouncementRequestBody): Promise<CreateAnnouncementReturnType>;
    UpdateAnnouncementEncryptedMessage(
      id: string,
      body: UpdateAnnouncementEncryptedMessageRequestBody,
    ): Promise<UpdateAnnouncementEncryptedMessageReturnType>;
    GetAnnouncementEncryptedMessage(id: string): Promise<GetAnnouncementEncryptedMessageReturnType>;
    GetAnnouncements(
      startTime?: number,
      endTime?: number,
      size?: number,
      offset?: number,
    ): Promise<GetAnnouncementsReturnType>;
  };

  network: {
    GetNetworks(): Promise<GetNetworksReturnType>;
  };

  user: {
    RegisterCurvyHandle(body: RegisterCurvyHandleRequestBody): Promise<RegisterCurvyHandleReturnType>;
    ResolveCurvyHandle(username: string): Promise<ResolveCurvyHandleReturnType>;
    GetCurvyHandleByOwnerAddress(ownerAddress: string): Promise<GetCurvyHandleByOwnerAddressReturnType>;
  };

  auth: {
    GetBearerTotp(): Promise<string>;
    CreateBearerToken(body: {
      nonce: string;
      signature: string;
    }): Promise<string>;
    RefreshBearerToken(): Promise<string>;
  };
}

export type { IApiClient };
