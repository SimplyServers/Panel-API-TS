import * as configData from "../config.json";

import {IConfig} from "./types/IConfig";
import {Logger} from "./util/logger";

export class SimplyServersAPI{
    public static logger: Logger;
    public static config: IConfig;

    public static getRoot = (): string => {
        return __dirname;
    };

    constructor(){
        SimplyServersAPI.logger = new Logger(false);
        SimplyServersAPI.config = configData as IConfig;

        SimplyServersAPI.logger.info("Bootstrapping");
        this.bootstrap().then(() => {
            SimplyServersAPI.logger.info("Bootstrap done");
        }).catch(() => {

        });
    }
    private bootstrap = async (): Promise<void> => {
        SimplyServersAPI.logger.info("Bootstrap init");
    };
}
