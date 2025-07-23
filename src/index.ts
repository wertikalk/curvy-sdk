import { CurvySDK } from "./sdk";
import type { AuthConfig } from "./types";
import type { NetworkFilter } from "./utils/network";

// Single init function that supports both authentication methods
export const init = async (
    authConfig: AuthConfig,
    apiBaseUrl?: string,
    networkFilter: NetworkFilter = undefined,
    wasmUrl?: string
): Promise<CurvySDK> => {
    const sdk = new CurvySDK(authConfig, apiBaseUrl);

    await sdk.init(networkFilter, wasmUrl);

    return sdk;
};

// Export main classes and types
export { CurvySDK };
