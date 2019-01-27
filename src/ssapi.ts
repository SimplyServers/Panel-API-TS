import * as mongoose from "mongoose";

import * as configData from "../config.json";
import { APIServer } from "./api/server";
import ServerNode from "./database/models/node";
import User from "./database/models/user";
import { Storage } from "./database/storage";
import { NodeUpdater } from "./nodeUpdater";

import { IConfig } from "./types/IConfig";
import { Models } from "./types/models";
import { Logger } from "./util/logger";

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
        }).catch((err) => {
            SimplyServersAPI.logger.error("Bootstrap failed: " + err)
        });
    }
    private bootstrap = async (): Promise<void> => {
        SimplyServersAPI.logger.info("Bootstrap init");

        try {
            await mongoose.connect(SimplyServersAPI.config.database, { useNewUrlParser: true });
        }catch (e) {
            SimplyServersAPI.logger.error("Failed to connect to database: " + e);
            return;
        }
        SimplyServersAPI.logger.info("Connected to database");

        // Start updater
        const nodeUpdater = new NodeUpdater();
        // nodeUpdater.start();

        // Start API
        const apiServer = new APIServer();
        await apiServer.bootstrapExpress();
    };
}
