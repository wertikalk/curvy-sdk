import { HttpClient } from "@/client/http";
import type { IAPIClient } from "@/client/interface";
import type {
  CreateAnnouncementRequestBody,
  CreateAnnouncementReturnType,
  GetAnnouncementEncryptedMessageReturnType,
  GetAnnouncementsResponse,
  GetCurvyHandleByOwnerAddressResponse,
  NetworksWithCurrenciesResponse,
  RegisterCurvyHandleRequestBody,
  RegisterCurvyHandleReturnType,
  ResolveCurvyHandleReturnType,
  UpdateAnnouncementEncryptedMessageRequestBody,
  UpdateAnnouncementEncryptedMessageReturnType,
} from "@/types/api";
import { toSlug } from "@/utils/slug";

export class APIClient extends HttpClient implements IAPIClient {
  announcement = {
    CreateAnnouncement: async (body: CreateAnnouncementRequestBody) => {
      return await this.request<CreateAnnouncementReturnType>({
        method: "POST",
        path: "/announcement",
        body,
      });
    },
    GetAnnouncements: async (startTime: Date | undefined, endTime: Date | undefined, size: number) => {
      const queryParams: Record<string, string | number | boolean> = { size };

      if (startTime) {
        queryParams.startTime = startTime.getTime();
      }
      if (endTime) {
        queryParams.endTime = endTime.getTime();
      }

      const result = await this.request<GetAnnouncementsResponse>({
        method: "GET",
        path: "/announcement",
        queryParams,
      });

      // const optimizedAnnouncements = result.announcements.map((announcement) => ({
      //   ...announcement,
      //   ephemeralPublicKey: decimalStringToBytes(announcement.ephemeralPublicKey),
      // }));

      // return { total: result.total, announcements: optimizedAnnouncements };

      return result;
    },
    UpdateAnnouncementEncryptedMessage: async (id: string, body: UpdateAnnouncementEncryptedMessageRequestBody) => {
      return await this.request<UpdateAnnouncementEncryptedMessageReturnType>({
        method: "PATCH",
        path: `/announcement/${id}/encryptedMessage`,
        body,
      });
    },
    GetAnnouncementEncryptedMessage: async (id: string) => {
      return await this.request<GetAnnouncementEncryptedMessageReturnType>({
        method: "GET",
        path: "/announcement/{id}/encryptedMessage",
      });
    },
  };

  network = {
    GetNetworks: async () => {
      const networks = await this.request<NetworksWithCurrenciesResponse>({
        method: "GET",
        path: "/currency/latest",
      });

      return networks.map((network) => {
        return { ...network, rpcUrl: `${this.apiBaseUrl}/rpc/${toSlug(network.name)}` };
      });
    },
  };

  user = {
    RegisterCurvyHandle: async (body: RegisterCurvyHandleRequestBody) => {
      return await this.request<RegisterCurvyHandleReturnType>({
        method: "POST",
        path: "/user/register",
        body,
      });
    },

    ResolveCurvyHandle: async (username: string) => {
      return this.request<ResolveCurvyHandleReturnType>({
        method: "GET",
        path: `/user/resolve/${username}`,
      });
    },

    GetCurvyHandleByOwnerAddress: async (ownerAddress: string) => {
      const response = await this.request<GetCurvyHandleByOwnerAddressResponse>({
        method: "GET",
        path: `/user/check/${ownerAddress}`,
      });

      return response?.handle || null;
    },
  };

  auth = {
    UpdateBearerToken: async (newBearerToken: string) => {
      return this.UpdateBearerToken(newBearerToken);
    },
  };
}
