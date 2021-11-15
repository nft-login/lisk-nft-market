import { Application, PartialApplicationConfig, utils } from 'lisk-sdk';
import { registerModules } from './modules';
import { registerPlugins } from './plugins';

export const getApplication = (
	genesisBlock: Record<string, unknown>,
	config: PartialApplicationConfig,
): Application => {

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

	const app = Application.defaultApplication(genesisBlock, appConfig);

	registerModules(app);
	registerPlugins(app);

	return app;
};
