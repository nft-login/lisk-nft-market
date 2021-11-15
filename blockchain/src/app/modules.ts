/* eslint-disable @typescript-eslint/no-empty-function */
import { Application } from 'lisk-sdk';
import { NFTModule } from './modules/nft/nft_module';

export const registerModules = (app: Application): void => {
    app.registerModule(NFTModule);
};
