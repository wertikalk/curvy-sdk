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

export { getSignatureParams };
