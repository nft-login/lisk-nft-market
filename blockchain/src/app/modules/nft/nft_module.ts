import {
    BaseAsset,
    BaseModule
} from 'lisk-sdk';
import { getAllNFTTokensAsJSON } from './nft';

import {
    CreateNFTAsset
} from './transactions/create_nft_assets';
import {
    PurchaseNFTAsset
} from './transactions/purchase_nft_asset';
import {
    TransferNFTAsset
} from './transactions/transfer_nft_asset';

export class NFTModule extends BaseModule {
    name = "nft";
    id = 1024;
    accountSchema = {
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

    transactionAssets: BaseAsset[] = [new CreateNFTAsset(), new PurchaseNFTAsset(), new TransferNFTAsset()];
    actions = {
        getAllNFTTokens: async () => getAllNFTTokensAsJSON(this._dataAccess),
    };
};
