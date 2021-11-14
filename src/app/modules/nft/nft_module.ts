import {
    BaseAsset,
    BaseModule
} from 'lisk-sdk';
import { getAllNFTTokensAsJSON } from './nft';

import {
    CHAIN_STATE_NFT_TOKENS,
    registeredNFTTokensSchema
} from './schemas';

import {
    CreateNFTAsset
} from './transactions/create_nft_assets';

export class NFTModule extends BaseModule {
    public name = "nft";
    public id = 1024;
    public schema = {
        type: "object",
        required: ["ownNFTs"],
        properties: {
            ownNFTs: {
                type: "array",
                fieldNumber: 1,
                items: {
                    dataType: "bytes",
                },
            },
        },
        default: {
            ownNFTs: [],
        },
    };

    public transactionAssets: BaseAsset[] = [new CreateNFTAsset()];

    public actions = {
        getAllNFTTokens: async () => getAllNFTTokensAsJSON(this._dataAccess),
    };
};
