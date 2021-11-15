import {
    codec,
    cryptography
} from 'lisk-sdk';

import {
    CHAIN_STATE_NFT_TOKENS,
    registeredNFTTokensSchema
} from './schemas';

import { NFTToken } from './nft_token';

const createNFTToken = ({ name, ownerAddress, nonce, value, minPurchaseMargin }): NFTToken => {
    const nonceBuffer = Buffer.alloc(8);
    nonceBuffer.writeBigInt64LE(nonce);
    const seed = Buffer.concat([ownerAddress, nonceBuffer]);
    const id = cryptography.hash(seed);

    return {
        id,
        minPurchaseMargin,
        name,
        ownerAddress,
        value,
    };
};

const getAllNFTTokens = async (stateStore): Promise<[NFTToken]> => {
    const registeredTokensBuffer = await stateStore.chain.get(
        CHAIN_STATE_NFT_TOKENS
    );
    if (!registeredTokensBuffer) {
        return [] as unknown as [NFTToken];
    }

    const registeredTokens: { registeredNFTTokens: [NFTToken] } = codec.decode(
        registeredNFTTokensSchema,
        registeredTokensBuffer
    );

    return registeredTokens.registeredNFTTokens;
};


const getAllNFTTokensAsJSON = async (dataAccess): Promise<[]> => {
    const registeredTokensBuffer = await dataAccess.getChainState(
        CHAIN_STATE_NFT_TOKENS
    );

    if (!registeredTokensBuffer) {
        return [];
    }

    const registeredTokens: { registeredNFTTokens } = codec.decode(
        registeredNFTTokensSchema,
        registeredTokensBuffer
    );

    return codec.toJSON<{ registeredNFTTokens }>(registeredNFTTokensSchema, registeredTokens)
        .registeredNFTTokens;
};

const setAllNFTTokens = async (stateStore, NFTTokens) => {
    const registeredTokens = {
        registeredNFTTokens: NFTTokens.sort((a, b) => a.id.compare(b.id)),
    };

    await stateStore.chain.set(
        CHAIN_STATE_NFT_TOKENS,
        codec.encode(registeredNFTTokensSchema, registeredTokens)
    );
};

export { createNFTToken, getAllNFTTokens, getAllNFTTokensAsJSON, setAllNFTTokens }
