export const CHAIN_STATE_NFT_TOKENS = "nft:registeredNFTTokens";
export const NFT_TOKEN_ID = 0;

export const registeredNFTTokensSchema = {
    $id: "lisk/nft/registeredTokens",
    type: "object",
    required: ["registeredNFTTokens"],
    properties: {
        registeredNFTTokens: {
            type: "array",
            fieldNumber: 1,
            items: {
                type: "object",
                required: ["id", "value", "ownerAddress"],
                properties: {
                    id: {
                        dataType: "bytes",
                        fieldNumber: 1,
                    },
                    value: {
                        dataType: "uint64",
                        fieldNumber: 2,
                    },
                    ownerAddress: {
                        dataType: "bytes",
                        fieldNumber: 3,
                    }
                },
            },
        },
    },
};