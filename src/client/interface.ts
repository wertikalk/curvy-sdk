import type {
  CreateAnnouncementRequestBody,
  CreateAnnouncementReturnType,
  GetAnnouncementEncryptedMessageRequestBody,
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

export interface IAPIClient {
  announcement: {
    CreateAnnouncement(body: CreateAnnouncementRequestBody): Promise<CreateAnnouncementReturnType>;
    UpdateAnnouncementEncryptedMessage(
      id: string,
      body: UpdateAnnouncementEncryptedMessageRequestBody,
    ): Promise<UpdateAnnouncementEncryptedMessageReturnType>;
    GetAnnouncementEncryptedMessage(
      body: GetAnnouncementEncryptedMessageRequestBody,
    ): Promise<GetAnnouncementEncryptedMessageReturnType>;
    GetAnnouncements(
      startTime: Date | undefined,
      endTime: Date | undefined,
      size: number,
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
    UpdateBearerToken(newBearerToken: string): void;
  };
}
