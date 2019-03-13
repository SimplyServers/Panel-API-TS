import * as bodyParser from "body-parser";
import * as express from "express";
import * as ExpressValidator from "express-validator";
import * as fs from "fs-extra";
import * as http from "http";
import * as https from "https";
import * as Raven from "raven";
import * as SocketIO from "socket.io";
import { SimplyServersAPI } from "../SimplyServersAPI";
import { GroupController } from "./controllers/admin/GroupController";
import { NodeController } from "./controllers/admin/NodeController";
import { PresetController } from "./controllers/admin/PresetController";
import { UserController } from "./controllers/admin/UserController";
import { AnalyticsController } from "./controllers/user/AnalyticsController";
import { AuthController } from "./controllers/user/AuthController";
import { ControlsController } from "./controllers/user/gameserver/ControlsController";
import { FSController } from "./controllers/user/gameserver/FSController";
import { GameserverController } from "./controllers/user/gameserver/GameServerController";
import { PowerController } from "./controllers/user/gameserver/PowerController";
import { ProfileController } from "./controllers/user/ProfileController";
import { SimpleCoreController } from "./controllers/user/specialized/SimpleCoreController";
import { Passport } from "./Passport";
import { SocketServer } from "./SocketServer";

export class APIServer {
  public express;
  public http;
  public https;
  public io;
  public bootstrapExpress = async (): Promise<void> => {
    Raven.config(
      "https://bfbb378696fe46ffaf132cc1c6b24dfa:6e433d90864f47b5a165b460258d37e1@sentry.simplyservers.io/4"
    );
    this.express.use(Raven.requestHandler());

    // CORS
    this.express.disable("x-powered-by");
    this.express.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requeted-With, Content-Type, Accept, Authorization, RBR"
      );
      if (req.headers.origin) {
        res.header("Access-Control-Allow-Origin", req.headers.origin);
      }
      if (req.method === "OPTIONS") {
        res.header(
          "Access-Control-Allow-Methods",
          "GET, POST, PUT, PATCH, DELETE"
        );
        return res.status(200).json({});
      }
      next();
    });

    // Body Parser
    this.express.use(bodyParser.urlencoded({ extended: false })); // Allow Express to handle json in bodies
    this.express.use(bodyParser.json()); //                                ^

    // Validation
    this.express.use(ExpressValidator());

    // Basic home page
    this.express.get("/", (req, res) => {
      res.set("location", "https://simplyservers.io");
      res.status(301).send();
    });

    // Mount our routes
    this.mountRoutes();

    // Passport
    Passport.bootstrap();

    // Error handling
    this.express.use(Raven.errorHandler());
    this.express.use((err, req, res, next) => {
      console.log(err);
      console.log("error handler triggered");
      if (err.name === "UnauthorizedError") {
        res.status(401);
        res.json({
          error: true,
          msg: "This endpoint requires authentication."
        });
      } else if (err.name === "ActionFailed") {
        res.status(400);
        if (err.showInProd || process.env.NODE_ENV === "dev") {
          res.json({
            error: true,
            msg: err.message
          });
        } else {
          res.status(400);
          SimplyServersAPI.logger.error(err);
          res.json({
            error: true,
            msg: "Action failed."
          });
        }
      } else if (err.name === "ValidationError") {
        res.status(400);
        res.json({
          error: true,
          msg: "Validation error.",
          field: err.field
        });
      } else {
        SimplyServersAPI.logger.error(err);
        res.status(500);
        res.json({
          error: "true"
        });
      }
    });

    await this.createHttp();
  };
  private createHttp = async (): Promise<void> => {
    SimplyServersAPI.logger.verbose("Loading API...");

    if (process.env.NODE_ENV === "dev") {
      // Create dev server
      this.http = http.createServer(this.express);

      // Create SocketServer
      this.io = SocketIO(this.http, {
        path: "/s"
      });
    } else {
      // Create redirect prod server
      this.http = http.createServer((req, res) => {
        res.writeHead(301, {
          Location:
            "https://" +
            SimplyServersAPI.config.web.host +
            ":" +
            SimplyServersAPI.config.web.ports.https +
            req.url
        });
        res.end();
      });

      const creds = {
        key: await fs.readFile(SimplyServersAPI.config.ssl.key),
        cert: await fs.readFile(SimplyServersAPI.config.ssl.cert)
      };

      this.https = https.createServer(creds, this.express);

      // Create SocketServer
      this.io = SocketIO(this.https, {
        path: "/s"
      });
    }

    this.io.origins((origin, callback) => {
      callback(null, true);
    });

    // TODO: test shit
    const socketServer = new SocketServer(this.io);
    socketServer.bootstrap();

    // Listen on the HTTP/HTTPS port
    this.http.listen(SimplyServersAPI.config.web.ports.http);
    if (this.https) {
      this.https.listen(SimplyServersAPI.config.web.ports.https);
    }

    SimplyServersAPI.logger.info(
      "API server done loading. HTTP: " +
      SimplyServersAPI.config.web.ports.http +
      ", HTTPS: " +
      SimplyServersAPI.config.web.ports.https
    );
  };
  private mountRoutes = (): void => {
    const router = express.Router();

    const controlsController = new ControlsController();
    controlsController.initRoutes(router);

    const authController = new AuthController();
    authController.initRoutes(router);

    const groupController = new GroupController();
    groupController.initRoutes(router);

    const nodeController = new NodeController();
    nodeController.initRoutes(router);

    const presetController = new PresetController();
    presetController.initRoutes(router);

    const userController = new UserController();
    userController.initRoutes(router);

    const profileController = new ProfileController();
    profileController.initRoutes(router);

    const powerController = new PowerController();
    powerController.initRoutes(router);

    const fsController = new FSController();
    fsController.initRoutes(router);

    const gameServerController = new GameserverController();
    gameServerController.initRoutes(router);

    const analyticsController = new AnalyticsController();
    analyticsController.initRoutes(router);

    const simpleCoreController = new SimpleCoreController();
    simpleCoreController.initRoutes(router);

    this.express.use("/api/v1/", router);
  };

  constructor() {
    this.express = express();
  }
}
