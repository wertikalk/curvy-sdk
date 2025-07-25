import { Types } from "./types";

export class APIClient implements IAPIClient {
    request: <T>(options: any) => Promise<T>;

    constructor(request: any) {
        this.request = request;
    }
    public async GetCSAInfo(
        req: Types.APIClient.GetCSAInfoRequest
    ): Promise<Types.APIClient.GetCSAInfoResponse> {
        const response =
            (await this.request<Types.APIClient.GetCSAInfoResponse>({
                method: "POST",
                path: "/csuc/csa-info",
                body: { ...req },
            })) as any;

        // console.log("sdk: GetCSAInfoOnCSUC RESPONSE:", response);
        // console.log("sdk: GetCSAInfoOnCSUC  type:", typeof response);
        return response;
    }

    public async EstimateAction(
        req: Types.APIClient.GetActionEstimatedCostRequest
    ): Promise<Types.APIClient.GetActionEstimatedCostResponse> {
        const response =
            (await this.request<Types.APIClient.GetActionEstimatedCostResponse>(
                {
                    method: "POST",
                    path: "/csuc/estimate-action-cost",
                    body: {
                        ...req,
                    },
                }
            )) as any;

        // console.log("sdk: EstimateActionInsideCSUC RESPONSE:", response);
        // console.log("sdk: EstimateActionInsideCSUC  type:", typeof response);

        return response;
    }
    public async SubmitActionRequest(
        req: Types.APIClient.CreateActionRequest
    ): Promise<Types.APIClient.CreateActionResponse> {
        const response =
            (await this.request<Types.APIClient.CreateActionResponse>({
                method: "POST",
                path: "/csuc/submit-action",
                body: {
                    ...req,
                },
            })) as any;

        // console.log(
        //     "sdk: SubmitRequestForActionInsideCSUC RESPONSE:",
        //     response
        // );
        // console.log(
        //     "sdk: SubmitRequestForActionInsideCSUC  type:",
        //     typeof response
        // );

        return response;
    }
}

export interface IAPIClient {
    // GetCSA(): Promise<string>;
    GetCSAInfo(
        req: Types.APIClient.GetCSAInfoRequest
    ): Promise<Types.APIClient.GetCSAInfoResponse>;
    EstimateAction(
        req: Types.APIClient.GetActionEstimatedCostRequest
    ): Promise<Types.APIClient.GetActionEstimatedCostResponse>;
    SubmitActionRequest(
        req: Types.APIClient.CreateActionRequest
    ): Promise<Types.APIClient.CreateActionResponse>;
}
