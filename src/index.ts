import { CurvySDK } from "./sdk";
import type { NetworkFilter } from "./utils/network";

// Single init function that supports both authentication methods
export const init = async (
  apiKey: string,
  apiBaseUrl?: string,
  networkFilter: NetworkFilter = undefined,
  wasmUrl?: string,
): Promise<CurvySDK> => {
  const sdk = new CurvySDK(apiKey, apiBaseUrl);

  await sdk.init(networkFilter, wasmUrl);

  return sdk;
};

// Export main classes and types
export { CurvySDK };
