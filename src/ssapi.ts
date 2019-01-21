import * as mongoose from "mongoose";

import * as configData from "../config.json";
import { APIServer } from "./api/server";
import BugReport, { IBugReport } from "./database/models/bugreport";
import Group, { IGroup } from "./database/models/group";
import MinecraftPlugin, { IMinecraftPlugin } from "./database/models/minecraftPlugin";
import MinecraftProperties, { IMinecraftProperties } from "./database/models/minecraftProperties";
import ServerNode, { IServerNode } from "./database/models/node";
import Preset, { IPreset } from "./database/models/preset";
import User, { IUser } from "./database/models/user";
import { NodeUpdater } from "./nodeUpdater";

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

        try {
            await mongoose.connect(SimplyServersAPI.config.database, { useNewUrlParser: true });
        }catch (e) {
            SimplyServersAPI.logger.error("Failed to connect to database: " + e);
            return;
        }
        SimplyServersAPI.logger.info("Connected to database");

        // Add modals
        mongoose.model<IBugReport>('BugReport', BugReport);
        mongoose.model<IServerNode>('Node', ServerNode);
        mongoose.model<IGroup>('Group', Group);
        mongoose.model<IPreset>('Preset', Preset);
        mongoose.model<IMinecraftPlugin>('MinecraftPlugin', MinecraftPlugin);
        mongoose.model<IMinecraftProperties>('MinecraftProperties', MinecraftProperties);
        mongoose.model<IUser>('User', User);

        // Start updater
        const nodeUpdater = new NodeUpdater();
        nodeUpdater.start();

        // Start API
        const apiServer = new APIServer();
        await apiServer.bootstrapExpress();
    };
}
