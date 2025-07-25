import { APIError } from "../errors";
import type {
    Announcement,
    AuthConfig,
    CreateAnnouncementParams,
    CreateAnnouncementResponse,
    CreateGasSponsorshipRequest,
    CreateGasSponsorshipResponse,
    GetAnnouncementsResponse,
    GetUsernameByOwnerAddressResponse,
    Network,
    ResolveUsernameResponse,
} from "../types";
import { decimalStringToBytes } from "../utils/publicKeyEncoding";
import { toSlug } from "../utils/slug";
import type { IAPIClient } from "./interface";
import { APIClient as APIClientForCSUC } from "../features/csuc";

const DEFAULT_TIMEOUT = 5000;

type RequestOptions = {
    method: string;
    path: string;
    body?: unknown;
    timeout?: number;
    queryParams?: Record<string, string | number | boolean>;
};

export class APIClient implements IAPIClient {
    private apiKey?: string;
    private bearerToken?: string;
    private readonly apiBaseUrl: string;
    CSUC: APIClientForCSUC;

    constructor(authConfig: AuthConfig, apiBaseUrl?: string) {
        // Ensure at least one authentication method is provided
        if (!authConfig.apiKey && !authConfig.bearerToken) {
            throw new Error("Either apiKey or bearerToken must be provided");
        }

        // Ensure only one authentication method is provided
        if (authConfig.apiKey && authConfig.bearerToken) {
            throw new Error(
                "Cannot provide both apiKey and bearerToken, choose one"
            );
        }

        this.apiKey = authConfig.apiKey;
        this.bearerToken = authConfig.bearerToken;

        this.apiBaseUrl = apiBaseUrl || "https://api.curvy.box";

        this.CSUC = new APIClientForCSUC(this.request.bind(this));
    }

    // Method to update the bearer token (for token refresh scenarios)
    public UpdateBearerToken(newBearerToken: string): void {
        this.bearerToken = newBearerToken;
        this.apiKey = undefined; // Clear API key when switching to bearer token
    }

    private getHeaders(): Record<string, string> {
        const baseHeaders = {
            "Content-Type": "application/json",
            "User-Agent": "curvy-sdk",
        };

        if (this.bearerToken) {
            return {
                ...baseHeaders,
                Authorization: `Bearer ${this.bearerToken}`,
            };
        }

        if (this.apiKey) {
            return {
                ...baseHeaders,
                "X-Curvy-API-Key": this.apiKey,
            };
        }

        throw new Error("No authentication method available");
    }

    private async request<T>({
        method,
        path,
        body,
        timeout = DEFAULT_TIMEOUT,
        queryParams,
    }: RequestOptions): Promise<T> {
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
                throw new APIError(
                    "Invalid JSON response",
                    response.status,
                    await response.text()
                );
            }

            if (
                responseBody.error !== undefined &&
                responseBody.data === undefined
            ) {
                throw new APIError(
                    responseBody.error || `HTTP ${response.status}`,
                    response.status,
                    responseBody
                );
            }

            // console.log(
            //     `API Response for ${method} ${path}:`,
            //     responseBody,
            //     `Status: ${response.status}`
            // );

            if (responseBody.data === undefined) {
                throw new APIError(
                    "Missing data in response",
                    response.status,
                    responseBody
                );
            }

            if (Array.isArray(responseBody.data)) {
                responseBody.data = responseBody.data.map((item) => {
                    try {
                        return typeof item === "string"
                            ? JSON.parse(item)
                            : item;
                    } catch {
                        return item;
                    }
                }) as T;
            } else if (
                responseBody.data &&
                typeof responseBody.data === "object"
            ) {
                for (const key of Object.keys(responseBody.data)) {
                    try {
                        const value = (responseBody.data as any)[key];
                        (responseBody.data as any)[key] =
                            typeof value === "string"
                                ? JSON.parse(value)
                                : value;
                    } catch {
                        // leave as is if parsing fails
                    }
                }
            }

            return responseBody.data;
        } catch (error) {
            if (error instanceof APIError) {
                throw error;
            }

            throw new APIError(
                `Request failed: ${(error as Error).message}`,
                undefined,
                error
            );
        } finally {
            clearTimeout(timeoutId);
        }
    }

    public async CreateAnnouncement(
        data: CreateAnnouncementParams
    ): Promise<CreateAnnouncementResponse> {
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
        size: number
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
                network.rpcUrl = `${this.apiBaseUrl}/rpc/${toSlug(
                    network.name
                )}`;
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

    public async GetCurvyHandleByOwnerAddress(
        ownerAddress: string
    ): Promise<string | undefined> {
        const response = await this.request<GetUsernameByOwnerAddressResponse>({
            method: "GET",
            path: `/user/check/${ownerAddress}`,
        });

        return response?.handle;
    }

    public async SubmitGasSponsorshipRequest(
        req: CreateGasSponsorshipRequest
    ): Promise<any> {
        const response = await this.request<CreateGasSponsorshipResponse>({
            method: "POST",
            path: "/gas-sponsorship/submit-action",
            body: { actions: req.actions },
        });

        console.log("sdk: GAS SPONSORSHIP RESPONSE:", response);
        return response;
    }
}
