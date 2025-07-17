import { APIError } from "@/errors";
import type { AuthConfig } from "@/types";

const DEFAULT_TIMEOUT = 5000;

type RequestOptions = {
  method: string;
  path: string;
  body?: unknown;
  timeout?: number;
  queryParams?: Record<string, string | number | boolean>;
};

class HttpClient {
  private apiKey?: string;
  private bearerToken?: string;
  protected readonly apiBaseUrl: string;

  constructor(authConfig: AuthConfig, apiBaseUrl?: string) {
    // Ensure at least one authentication method is provided
    if (!authConfig.apiKey && !authConfig.bearerToken) {
      throw new Error("Either apiKey or bearerToken must be provided");
    }

    // Ensure only one authentication method is provided
    if (authConfig.apiKey && authConfig.bearerToken) {
      throw new Error("Cannot provide both apiKey and bearerToken, choose one");
    }

    this.apiKey = authConfig.apiKey;
    this.bearerToken = authConfig.bearerToken;

    this.apiBaseUrl = apiBaseUrl || "https://api.curvy.box";
  }

  // Method to update the bearer token (for token refresh scenarios)
  protected UpdateBearerToken(newBearerToken: string): void {
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

  protected async request<T>({
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
        throw new APIError("Invalid JSON response", response.status, await response.text());
      }

      if (responseBody.error !== undefined && responseBody.data === undefined) {
        throw new APIError(responseBody.error || `HTTP ${response.status}`, response.status, responseBody);
      }

      if (responseBody.data === undefined) {
        throw new APIError("Missing data in response", response.status, responseBody);
      }

      return responseBody.data;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }

      throw new APIError(`Request failed: ${(error as Error).message}`, undefined, error);
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export { HttpClient };
