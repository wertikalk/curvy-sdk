import { APIError } from "../errors";
import type {
  Announcement,
  CreateAnnouncementParams,
  CreateAnnouncementResponse,
  GetAnnouncementsResponse,
  GetUsernameByOwnerAddressResponse,
  Network,
  ResolveUsernameResponse,
} from "../types";
import { decimalStringToBytes } from "../utils/publicKeyEncoding";
import { toSlug } from "../utils/slug";
import type { IAPIClient } from "./interface";

const DEFAULT_TIMEOUT = 5000;

type RequestOptions = {
  method: string;
  path: string;
  body?: unknown;
  timeout?: number;
  queryParams?: Record<string, string | number | boolean>;
};

export class APIClient implements IAPIClient {
  private apiKey: string;
  private bearerToken?: string;
  private readonly apiBaseUrl: string;

  constructor(apiKey: string, apiBaseUrl?: string) {
    this.apiKey = apiKey;

    this.apiBaseUrl = apiBaseUrl || "https://api.curvy.box";
  }

  public UpdateBearerToken(newBearerToken: string): void {
    this.bearerToken = newBearerToken;
  }

  private getHeaders(): Record<string, string> {
    const baseHeaders = {
      "Content-Type": "application/json",
      "User-Agent": "curvy-sdk",
      "X-Curvy-API-Key": this.apiKey,
    };

    if (this.bearerToken) {
      return {
        ...baseHeaders,
        Authorization: `Bearer ${this.bearerToken}`,
      };
    }

    return baseHeaders;
  }

  private async request<T>({ method, path, body, timeout = DEFAULT_TIMEOUT, queryParams }: RequestOptions): Promise<T> {
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), timeout);

    try {
      const url = new URL(`${this.apiBaseUrl}${path}`);
      if (queryParams) {
        for (const [key, value] of Object.entries(queryParams)) {
          url.searchParams.append(key, String(value));
        }
      }

      const response = await fetch(url.toString(), {
        method,
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);

      let responseBody: { data?: T; error?: string };
      try {
        responseBody = await response.json();
      } catch (e) {
        throw new APIError("Invalid JSON response", response.status, await response.text());
      }

      if (responseBody.error !== undefined && responseBody.data === undefined) {
        throw new APIError(responseBody.error || `HTTP ${response.status}`, response.status, responseBody);
      }

      // @ts-ignore
      return responseBody?.data ?? responseBody;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }

      throw new APIError(`Request failed: ${(error as Error).message}`, undefined, error);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  public async CreateAnnouncement(data: CreateAnnouncementParams): Promise<CreateAnnouncementResponse> {
    return await this.request<CreateAnnouncementResponse>({
      method: "POST",
      path: "/announcement",
      body: data,
    });
  }

  // GetAnnouncements will fetch the announcements from a defined offset and size
  public async GetAnnouncements(
    startTime: Date | undefined,
    endTime: Date | undefined,
    size: number,
  ): Promise<GetAnnouncementsResponse> {
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

    result.announcements = result.announcements.map((a: Announcement) => ({
      ...a,
      ephemeralPublicKey: decimalStringToBytes(a.ephemeralPublicKey),
    }));

    return result;
  }

  // GetNetworks will return the list of supported networks with currencies
  public async GetNetworks(): Promise<Network[]> {
    const networks = await this.request<Network[]>({
      method: "GET",
      path: "/currency/latest",
    });

    return networks.map((network) => {
      if (!network.rpcUrl) {
        network.rpcUrl = `${this.apiBaseUrl}/rpc/${toSlug(network.name)}`;
      }

      return network;
    });
  }

  public async ResolveUsername(username: string) {
    return this.request<ResolveUsernameResponse>({
      method: "GET",
      path: `/user/resolve/${username}`,
    });
  }

  public async GetCurvyHandleByOwnerAddress(ownerAddress: string): Promise<string | undefined> {
    const response = await this.request<GetUsernameByOwnerAddressResponse>({
      method: "GET",
      path: `/user/check/${ownerAddress}`,
    });

    return response?.handle;
  }

  public async GetBearerTotp(): Promise<string> {
    return (
      await this.request<{
        nonce: string;
      }>({
        method: "GET",
        path: "/auth/nonce",
      })
    ).nonce;
  }

  public async CreateBearerToken(body: { nonce: string; signature: string }): Promise<string> {
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
  }

  public async RefreshBearerToken(): Promise<string> {
    return (
      await this.request<{
        success: boolean;
        token: string;
      }>({
        method: "POST",
        path: "/auth/renew",
      })
    ).token;
  }
}
