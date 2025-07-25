import { Types } from "./types";

export class APIClient implements IAPIClient {
    request: <T>(options: any) => Promise<T>;

    constructor(request: any) {
        this.request = request;
    }

    public async SubmitRequest(
        action: Types.Action
    ): Promise<Types.APIClient.Response> {
        const response = await this.request<Types.APIClient.Response>({
            method: "POST",
            path: "/gas-sponsorship/submit-action",
            body: { actions: [action] },
        });

        return response;
    }
}

export interface IAPIClient {
    SubmitRequest(action: Types.Action): Promise<Types.APIClient.Response>;
}
