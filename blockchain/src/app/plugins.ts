/* eslint-disable @typescript-eslint/no-empty-function */
import { Application, HTTPAPIPlugin } from 'lisk-sdk';
import { DashboardPlugin } from '@liskhq/lisk-framework-dashboard-plugin';
import { NFTAPIPlugin } from './plugins/nft_api_plugin';

export const registerPlugins = (app: Application): void => {
    app.registerPlugin(HTTPAPIPlugin);
    app.registerPlugin(DashboardPlugin);
    app.registerPlugin(NFTAPIPlugin);
};
