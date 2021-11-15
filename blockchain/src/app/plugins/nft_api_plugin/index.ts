import * as express from 'express';
import type { Express } from 'express';
import fetch from 'node-fetch';
import { Server } from 'http';
import * as cors from 'cors';
import { BasePlugin, BaseChannel, codec, db } from 'lisk-sdk';
import { NodeInfo } from '@liskhq/lisk-api-client/dist-node/types';
const pJSON = require("../../../../package.json");
import { getDBInstance, getNFTHistory, getAllTransactions, saveNFTHistory, saveTransactions } from "./db";
import { NFTToken } from '../../modules/nft/nft_token';

// 1.plugin can be a daemon/HTTP/Websocket service for off-chain processing
export class NFTAPIPlugin extends BasePlugin {
    _server!: Server;
    _app!: Express;
    _channel!: BaseChannel;
    _db!: db.KVStore;
    _nodeInfo!: NodeInfo;

    static get alias() {
        return "NFTHttpApi";
    }

    static get info() {
        return {
            author: pJSON.author,
            version: pJSON.version,
            name: pJSON.name,
        };
    }

    get defaults() {
        return {};
    }

    get events() {
        return [];
    }

    get actions() {
        return {};
    }

    async load(channel: BaseChannel) {
        this._app = express();
        this._channel = channel;
        this._db = await getDBInstance();
        this._nodeInfo = await this._channel.invoke("app:getNodeInfo");


        this._app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT"] }));
        this._app.use(express.json());

        this._app.get("/api/nft_tokens", async (_req, res) => {
            const nftTokens: NFTToken[] = this._channel ? await this._channel.invoke("nft:getAllNFTTokens") : [];
            const data = await Promise.all(nftTokens?.map(async token => {
                const dbKey = `nft:${token.id}`;
                let tokenHistory = await getNFTHistory(this._db, dbKey);
                tokenHistory = tokenHistory.map(h => h.toString('binary'));
                return {
                    ...token,
                    tokenHistory,
                }
            }));

            res.json({ data });
        });

        this._app.get("/api/nft_tokens/:id", async (req, res) => {
            const nftTokens: NFTToken[] = this._channel ? await this._channel.invoke("nft:getAllNFTTokens") : [];
            const token = nftTokens.find((t) => t.id === req.params.id);
            const dbKey = `nft:${token?.id}`;
            let tokenHistory = await getNFTHistory(this._db, dbKey);
            tokenHistory = tokenHistory.map(h => h.toString('binary'));

            res.json({ data: { ...token, tokenHistory } });
        });

        this._app.get("/api/transactions", async (_req, res) => {
            const transactions = await getAllTransactions(this._db, this.schemas);

            const data = transactions.map(trx => {
                const module = this._nodeInfo.registeredModules.find(m => m.id === trx.moduleID);
                const asset = module?.transactionAssets.find(a => a.id === trx.assetID);
                return {
                    ...trx,
                    ...trx.asset,
                    moduleName: module?.name,
                    assetName: asset?.name,
                }
            })
            res.json({ data });
        });

        // proxy for http api
        this._app.get("/api/node/info", async (_req, res) => {
            return fetch("http://localhost:4000/api/node/info")
                .then((_res) => _res.json())
                .then((_res) => res.json(_res));
        });
        this._app.get("/api/accounts/:id", async (req, res) => {
            return fetch(`http://localhost:4000/api/accounts/${req.params.id}`)
                .then((_res) => _res.json())
                .then((_res) => res.json(_res));
        });
        this._app.post("/api/transactions", async (req, res) => {
            return fetch(`http://localhost:4000/api/transactions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(req.body),
            })
                .then((_res) => _res.json())
                .then((_res) => res.json(_res));
        });

        this._subscribeToChannel();

        this._server = this._app.listen(8080, "0.0.0.0");
    }

    _subscribeToChannel() {
        // listen to application events and enrich blockchain data for UI/third party application
        this._channel?.subscribe('app:block:new', async (data) => {
            if (data) {
                const { block } = data as { readonly block: string };
                const { payload } = codec.decode(
                    this.schemas.block,
                    Buffer.from(block, 'hex'),
                );
                if (payload.length > 0) {
                    await saveTransactions(this._db, payload);
                    const decodedBlock = this.codec.decodeBlock(block);
                    // save NFT transaction history
                    await saveNFTHistory(this._db, decodedBlock, this._nodeInfo.registeredModules, this._channel);
                }
            }
        });
    }

    async unload() {
        // close http server
        await new Promise<void>((resolve, reject) => {
            this._server?.close((err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
        // close database connection
        await this._db?.close();
    }
}