import { Application, PartialApplicationConfig, utils, genesisBlockDevnet } from 'lisk-sdk';
import { registerModules } from './modules';
import { registerPlugins } from './plugins';
import NFTToken from '../../../frontend_app/src/components/NFTToken';

interface account {
	"address": string,
	"token": {
		"balance": string
	},
	"sequence": {
		"nonce": string
	},
	"keys": {
		"mandatoryKeys": [],
		"optionalKeys": [],
		"numberOfSignatures": number
	},
	"dpos": {
		"delegate": {
			"username": string
			"pomHeights": [],
			"consecutiveMissedBlocks": number,
			"lastForgedHeight": number,
			"isBanned": boolean,
			"totalVotesReceived": string
		},
		"sentVotes": [
			{
				"delegateAddress": string,
				"amount": string
			}
		],
		"unlocking": []
	},
	"nft": {
		"ownNFTs": []
	}
}

export const getApplication = (
	_genesisBlock: Record<string, unknown>,
	config: PartialApplicationConfig,
): Application => {

	/*genesisBlockDevnet.header.timestamp = 1605699440;
	let accounts = genesisBlockDevnet.header.asset.accounts;
	genesisBlockDevnet.header.asset.accounts = accounts.map(
		(a) =>
			utils.objects.mergeDeep({}, a, {
				nft: {
					ownNFTs: [] as NFTToken[],
				},
			}) as any,
	);*/

	const appConfig = utils.objects.mergeDeep({}, config, {
		//rpc: { enable: true, mode: "ws", host: "0.0.0.0" },
		plugins: {
			httpApi: {
				host: "0.0.0.0",
				port: 4000,
				whiteList: [],
				public: true,
				cors: {
					origin: '*',
					methods: ['GET', 'POST', 'PUT'],
				},
			},
			dashboard: {
				applicationUrl: 'ws://localhost:8080/ws',
				port: 4005,
				host: '0.0.0.0',
				applicationName: 'Lisk',
			}
		}
	});

	console.log(appConfig);

	const app = Application.defaultApplication(genesisBlockDevnet, appConfig);

	registerModules(app);
	registerPlugins(app);

	return app;
};
