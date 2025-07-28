const getSignatureParams = (messageToSign: string) => {
    return {
        domain: {
            name: "Curvy Protocol",
            version: "1.0.0",
            chainId: 1,
        },
        message: {
            title: "Curvy Protocol says 'Zdravo'!",
            content: `Curvy Protocol requests signature: ${messageToSign}`,
        },
        primaryType: "AuthMessage",
        types: {
            EIP712Domain: [
                { name: "name", type: "string" },
                { name: "version", type: "string" },
                { name: "chainId", type: "uint256" },
            ],
            AuthMessage: [
                {
                    name: "title",
                    type: "string",
                },
                {
                    name: "content",
                    type: "string",
                },
            ],
        },
    };
};

namespace CSUC {
    export const DeploymentAddresses = {
        "ethereum-sepolia": {
            Main: "0x1b6771B255912546b89a244136674269F008e223",
        },
    };

    export const NATIVE_TOKEN_ADDRESS = `0x0000000000000000000000000000000000000001`;

    export const EnabledTokens = {
        "ethereum-sepolia": [
            { address: NATIVE_TOKEN_ADDRESS, symbol: "ETH", decimals: 18 },
            {
                symbol: "USDC",
                address: "0x65aFADD39029741B3b8f0756952C74678c9cEC93",
                decimals: 6,
            },
            {
                address: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
                symbol: "LINK",
                decimals: 18,
            },
        ],
    };
}
export { getSignatureParams, CSUC };
