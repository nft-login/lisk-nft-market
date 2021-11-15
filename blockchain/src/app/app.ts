import { Application, PartialApplicationConfig, utils, configDevnet, genesisBlockDevnet } from 'lisk-sdk';
import { registerModules } from './modules';
import { registerPlugins } from './plugins';

export const getApplication = (
	_genesisBlock: Record<string, unknown>,
	_config: PartialApplicationConfig,
): Application => {

	genesisBlockDevnet.header.timestamp = 1605699440;
	let accounts = genesisBlockDevnet.header.asset.accounts;
	genesisBlockDevnet.header.asset.accounts = accounts.map(
		(a) =>
			utils.objects.mergeDeep({}, a, {
				nft: {
					ownNFTs: [],
				},
			}) as any,
	);

	const appConfig = utils.objects.mergeDeep({}, configDevnet, {
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
