import * as fs from "fs-extra";
import * as mongoose from "mongoose";

import * as configData from "../config.json";
import { APIServer } from "./api/APIServer";
import { GroupModel } from "./database/models/Group";
import { NodeUpdater } from "./NodeUpdater";

import { IConfig } from "./types/IConfig";
import { Logger } from "./util/Logger";
import { Util } from "./util/Util";

export class SimplyServersAPI {
  public static logger: Logger;
  public static config: IConfig;

  public static getRoot = (): string => {
    return __dirname;
  };

  constructor() {
    SimplyServersAPI.logger = new Logger(false);
    SimplyServersAPI.config = configData as IConfig;

    SimplyServersAPI.logger.info("Bootstrapping");
    this.bootstrap()
      .then(() => {
        SimplyServersAPI.logger.info("Bootstrap done");
      })
      .catch(err => {
        SimplyServersAPI.logger.error("Bootstrap failed: " + err);
        process.exit(1);
        return;
      });
  }
  private bootstrap = async (): Promise<void> => {
    SimplyServersAPI.logger.info("Bootstrap init");

    // There is no config specified
    if (!SimplyServersAPI.config) {
        const defaultConfig: IConfig = {
          database: "mongodb://change:me@localhost:66996/changethis",
          ssl: {
            key: "./ssl/testing_localhost.key",
            cert: "./ssl/testing_localhost.crt"
          },
          web: {
            JWTSecret: "you better change this",
            captchaSecret: "and this",
            ports: {
              http: 8080,
              https: 8443
            },
            host: "localhost",
            motd: "Default Simply Servers API"
          },
          email: {
            user: "change@me.com",
            password: "change_this",
            host: "smtp.me.com",
            port: 696,
            from: "change@me.com"
          },
          simpleCoreSecret: Util.generateRandom(),
          defaultGroup: "5bf1194965ee972712fb5a03",
          socket:  {
            maxFileSize: 3
          }
        };
        
        await fs.writeJson("../config.json", defaultConfig);
        SimplyServersAPI.config = defaultConfig;
    }

    try {
      await mongoose.connect(
        SimplyServersAPI.config.database,
        { useNewUrlParser: true }
      );

      new GroupModel();

    } catch (e) {
      SimplyServersAPI.logger.error("Failed to connect to database: " + e);
      process.exit(1);
      return;
    }

    SimplyServersAPI.logger.info("Connected to database");

    // Start updater
    const nodeUpdater = new NodeUpdater();
    nodeUpdater.start();

    // Start API
    const apiServer = new APIServer();
    await apiServer.bootstrapExpress();
  };
}
