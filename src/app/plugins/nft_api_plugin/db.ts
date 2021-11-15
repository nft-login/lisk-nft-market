import * as fs_extra from "fs-extra";
import * as os from 'os';
import * as path from 'path';
import { cryptography, codec, db, Transaction } from 'lisk-sdk';

const DB_KEY_TRANSACTIONS = "nft:transactions";
const CREATENFT_ASSET_ID = 0;
const TRANSFERNFT_ASSET_ID = 2;

// Schemas
const encodedTransactionSchema = {
    $id: 'nft/encoded/transactions',
    type: 'object',
    required: ['transactions'],
    properties: {
        transactions: {
            type: 'array',
            fieldNumber: 1,
            items: {
                dataType: 'bytes',
            },
        },
    },
};

const encodedNFTHistorySchema = {
    $id: 'nft/encoded/nftHistory',
    type: 'object',
    required: ['nftHistory'],
    properties: {
        nftHistory: {
            type: 'array',
            fieldNumber: 1,
            items: {
                dataType: 'bytes',
            },
        },
    },
};

const getDBInstance = async (dataPath = './data', dbName = 'nft_plugin.db') => {
    const dirPath = path.join(dataPath.replace('~', os.homedir()), 'plugins/data', dbName);
    await fs_extra.ensureDir(dirPath);
    return new db.KVStore(dirPath);
};

const getTransactions = async (db) => {
    try {
        const encodedTransactions = await db.get(DB_KEY_TRANSACTIONS);
        const { transactions } = codec.decode(encodedTransactionSchema, encodedTransactions);
        return transactions;
    }
    catch (error) {
        return [];
    }
};

const getAllTransactions = async (db, registeredSchema): Promise<ReadonlyArray<Transaction>> => {
    const savedTransactions = await getTransactions(db);
    const transactions: Transaction[] = [];
    for (const trx of savedTransactions) {
        transactions.push(decodeTransaction(trx, registeredSchema));
    }
    return transactions;
}

const saveTransactions = async (db, payload) => {
    const savedTransactions = await getTransactions(db);
    const transactions = [...savedTransactions, ...payload];
    const encodedTransactions = codec.encode(encodedTransactionSchema, { transactions });
    await db.put(DB_KEY_TRANSACTIONS, encodedTransactions);
};

const getNFTHistory = async (db, dbKey) => {
    try {
        const encodedNFTHistory = await db.get(dbKey);
        const { nftHistory } = codec.decode(encodedNFTHistorySchema, encodedNFTHistory);

        return nftHistory;
    }
    catch (error) {
        return [];
    }
};

const saveNFTHistory = async (db, decodedBlock, registeredModules, channel) => {
    decodedBlock.payload.map(async trx => {
        const module = registeredModules.find(m => m.id === trx.moduleID);
        if (module.name === 'nft') {
            let dbKey, savedHistory, base32Address, nftHistory, encodedNFTHistory;
            if (trx.assetID === CREATENFT_ASSET_ID) {
                channel.invoke('nft:getAllNFTTokens').then(async (val) => {
                    for (let i = 0; i < val.length; i++) {
                        const senderAdress = cryptography.getAddressFromPublicKey(Buffer.from(trx.senderPublicKey, 'hex'));
                        if (val[i].ownerAddress === senderAdress.toString('hex')) {
                            dbKey = `nft:${val[i].id}`;
                            savedHistory = await getNFTHistory(db, dbKey);
                            if (savedHistory && savedHistory.length < 1) {
                                base32Address = cryptography.getBase32AddressFromPublicKey(Buffer.from(trx.senderPublicKey, 'hex'), 'lsk');
                                nftHistory = [Buffer.from(base32Address, 'binary'), ...savedHistory];
                                encodedNFTHistory = codec.encode(encodedNFTHistorySchema, { nftHistory });
                                await db.put(dbKey, encodedNFTHistory);
                            }
                        }
                    };
                });
            } else {
                dbKey = `nft:${trx.asset.nftId}`;
                base32Address = (trx.assetID === TRANSFERNFT_ASSET_ID) ? cryptography.getBase32AddressFromAddress(Buffer.from(trx.asset.recipient, 'hex')) : cryptography.getBase32AddressFromPublicKey(Buffer.from(trx.senderPublicKey, 'hex'), 'lsk');
                savedHistory = await getNFTHistory(db, dbKey);
                nftHistory = [Buffer.from(base32Address, 'binary'), ...savedHistory];
                encodedNFTHistory = codec.encode(encodedNFTHistorySchema, { nftHistory });
                await db.put(dbKey, encodedNFTHistory);
            }
        }
    });
};

const decodeTransaction = (
    encodedTransaction,
    registeredSchema,
): any => {
    const transaction: { id: string, asset: Buffer } = codec.decode(registeredSchema.transaction, encodedTransaction);
    const assetSchema = getTransactionAssetSchema(transaction, registeredSchema);
    const asset: {} = codec.decode(assetSchema, transaction.asset);
    const id: any = cryptography.hash(encodedTransaction);
    return {
        ...codec.toJSON(registeredSchema.transaction, transaction),
        asset: codec.toJSON(assetSchema, asset),
        id: id.toString('hex'),
    };
};

const getTransactionAssetSchema = (
    transaction,
    registeredSchema,
) => {
    const txAssetSchema = registeredSchema.transactionsAssets.find(
        assetSchema =>
            assetSchema.moduleID === transaction.moduleID && assetSchema.assetID === transaction.assetID,
    );
    if (!txAssetSchema) {
        throw new Error(
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            `ModuleID: ${transaction.moduleID} AssetID: ${transaction.assetID} is not registered.`,
        );
    }
    return txAssetSchema.schema;
};

export {
    getDBInstance,
    getAllTransactions,
    getTransactions,
    saveTransactions,
    saveNFTHistory,
    getNFTHistory,
}
