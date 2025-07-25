export namespace Types {
    export namespace APIClient {
        export type CreateRequest = {
            actions: Action[];
        };

        export type Response = {
            actionIds: string[];
        };
    }

    export type Action = {
        id?: string;
        networkId: number;
        payloads: ActionPayload[];
        signedPayloads: string[];
    };

    export type ActionPayload = {
        data: string;
    };

    export enum ActionStatus {
        INVALID = "INVALID",
        ACCEPTED = "ACCEPTED",
        BATCHED = "BATCHED",
        FINALIZED = "FINALIZED",
    }

    export type OnchainData = {
        fundingTxHash: string;
        fundingTxBlockHash?: string | null;
        approveTxHash: string;
        approveTxBlockHash?: string | null;
        csucWrappedTxHash: string;
        csucWrappedTxBlockHash?: string | null;
    };
}
