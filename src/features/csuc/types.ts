import { Network } from "../../types";

export namespace Types {
    export enum SupportedNetwork {
        ETHEREUM_SEPOLIA = "ethereum-sepolia",
    }

    export enum SupportedNetworkId {
        ETHEREUM_SEPOLIA = 1,
    }

    export enum SupportedNetworkChainId {
        ETHEREUM_SEPOLIA = "11155111",
    }

    export enum ActionSet {
        TRANSFER = "transfer",
        WITHDRAW = "withdraw",
        DEPOSIT_TO_AGGREGATOR = "deposit-to-aggregator",
    }

    export namespace APIClient {
        export type GetCSAInfoRequest = {
            network: SupportedNetwork | SupportedNetworkId;
            csas: string[];
        };

        export type GetCSAInfoResponse = {
            csaInfo: CSAInfo[];
        };

        export type GetActionEstimatedCostRequest = {
            payloads: ActionPayload[];
        };

        export type GetActionEstimatedCostResponse = {
            estimatedCosts: EstimatedActionCost[];
        };

        export type CreateActionRequest = {
            actions: Action[];
        };

        export type CreateActionResponse = {
            actionStatuses: ActionStatus[];
        };
    }

    export type ActionType = {
        service: "CSUC";
        type: ActionSet;
    };
    export type ActionPayload = {
        id?: number;
        network: SupportedNetwork;
        networkId: number;
        from: string;
        actionType: ActionType;
        encodedData: string;
        createdAt: Date;
    };

    export type EstimatedActionCost = {
        payload: ActionPayload;
        offeredTotalFee: string;
        explanation: string;
    };

    export type Action = {
        id?: string;
        payload: ActionPayload;
        totalFee: string;
        signature: Signature;
        createdAt?: Date;
    };

    export type Signature = {
        curve: "secp256k1";
        hash: string;
        r: string;
        s: string;
        v: string;
    };

    export enum ActionStage {
        INVALID = "INVALID",
        ACCEPTED = "ACCEPTED",
        BATCHED = "BATCHED",
        FINALIZED = "FINALIZED",
    }

    export type ActionStatus = {
        id: string;
        stage: ActionStage;
        estimatedInclusionTime: Date;
        batchId: string;
    };

    export enum BatchStage {
        WAITING = "WAITING",
        FULL = "FULL",
        SUBMITTED = "SUBMITTED",
        REVERTED = "REVERTED",
        FINALIZED = "FINALIZED",
    }

    export type Batch = {
        id: string;
        network: Network;
        stage: BatchStage;
        actionIds: string[];
        onChainHash: string;
        onChainCallParameters: any;
        onChainCost: string;
        createdAt: Date;
        updatedAt: Date;
    };
    export type CSAInfo = {
        network: SupportedNetwork;
        address: string;
        balances: Balance[];
        nonce: Nonce[];
    };

    export type Balance = {
        token: string;
        amount: string;
    };

    export type Nonce = {
        token: string;
        value: string;
    };
}
