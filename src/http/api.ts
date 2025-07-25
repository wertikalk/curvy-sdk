import { HttpClient } from "@/http/index";
import type { IApiClient } from "@/interfaces/api";
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
import { toSlug } from "@/utils/helpers";

class ApiClient extends HttpClient implements IApiClient {
  updateBearerToken = (bearer: string) => {
    return this._updateBearerToken(bearer);
  };

  announcement = {
    CreateAnnouncement: async (body: CreateAnnouncementRequestBody) => {
      return await this.request<CreateAnnouncementReturnType>({
        method: "POST",
        path: "/announcement",
        body,
      });
    },
    GetAnnouncements: async (startTime?: number, endTime?: number, size?: number, offset?: number) => {
      const queryParams: Record<string, string | number | boolean> = {};

      if (size) queryParams.size = size;
      if (offset) queryParams.offset = offset;
      if (startTime) queryParams.startTime = startTime;
      if (endTime) queryParams.endTime = endTime;

      const result = await this.request<GetAnnouncementsResponse>({
        method: "GET",
        path: "/announcement",
        queryParams,
      });

      return result.data;
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

      return networks.data.map((network) => {
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

      return response.data?.handle || null;
    },
  };

  auth = {
    GetBearerTotp: async () => {
      return (
        await this.request<{
          nonce: string;
        }>({
          method: "GET",
          path: "/auth/nonce",
        })
      ).nonce;
    },
    CreateBearerToken: async (body: { nonce: string; signature: string }) => {
      return (
        await this.request<{
          success: boolean;
          token: string;
        }>({
          method: "POST",
          body,
          path: "/auth",
        })
      ).token;
    },
    RefreshBearerToken: async () => {
      return (
        await this.request<{
          success: boolean;
          token: string;
        }>({
          method: "GET",
          path: "/auth/renew",
        })
      ).token;
    },
  };
}

export { ApiClient };
