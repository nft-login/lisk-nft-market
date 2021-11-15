import {
    BaseAsset
} from 'lisk-sdk';
import {
    getAllNFTTokens,
    setAllNFTTokens,
    createNFTToken,
} from '../nft';


// 1.extend base asset to implement your custom asset
export class CreateNFTAsset extends BaseAsset {
    // 2.define unique asset name and id
    name = "createNFT";
    id = 0;
    // 3.define asset schema for serialization
    schema = {
        $id: "lisk/nft/create",
        type: "object",
        required: ["initValue", "name"],
        properties: {
            initValue: {
                dataType: "uint64",
                fieldNumber: 1,
            },
            name: {
                dataType: "string",
                fieldNumber: 2,
            },
        },
    };
    validate({ asset }) {
        if (asset.initValue <= 0) {
            throw new Error("NFT init value is too low.");
        }
    };
    async apply({ asset, stateStore, reducerHandler, transaction }) {
        // 4.verify if sender has enough balance
        const senderAddress = transaction.senderAddress;
        const senderAccount = await stateStore.account.get(senderAddress);

        // 5.create nft
        const nftToken = createNFTToken({
            name: asset.name,
            ownerAddress: senderAddress,
            nonce: transaction.nonce,
            value: asset.initValue
        });

        // 6.update sender account with unique nft id
        senderAccount.nft.ownNFTs.push(nftToken.id);
        await stateStore.account.set(senderAddress, senderAccount);

        // 7.debit tokens from sender account to create nft
        await reducerHandler.invoke("token:debit", {
            address: senderAddress,
            amount: asset.initValue,
        });

        // 8.save nfts
        const allTokens = await getAllNFTTokens(stateStore);
        allTokens.push(nftToken);
        await setAllNFTTokens(stateStore, allTokens);
    }
}
