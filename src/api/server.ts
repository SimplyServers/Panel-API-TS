import * as bodyParser from "body-parser";
import * as express from "express";
import * as fs from "fs-extra";
import * as http from "http";
import * as https from "https";
import * as SocketIO from "socket.io";
import { SimplyServersAPI } from "../ssapi";
import { ControlsController } from "./controllers/user/gameserver/controlsController";
import { Passport } from "./passport";

export class APIServer {
  public express;
  public http;
  public https;
  public io;

  constructor() {
    this.express = express();
  }

  public bootstrapExpress = async (): Promise<void> => {
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
    this.express.use((err, req, res, next) => {
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
    if (process.env.NODE_ENV === "dev") {
      // Create dev server
      this.http = http.createServer(this.express);

      // Create SocketIO
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

      // Create SocketIO
      this.io = SocketIO(this.https, {
        path: "/s"
      });
    }

    this.io.origins((origin, callback) => {
      callback(null, true);
    });
    // TODO: socket namespace

    // Listen on the HTTP/HTTPS port
    this.http.listen(SimplyServersAPI.config.web.ports.http);
    if(this.https) {
      this.https.listen(SimplyServersAPI.config.web.ports.https);
    }

    SimplyServersAPI.logger.info("API server done loading. HTTP: " + SimplyServersAPI.config.web.ports.http + ", HTTPS: " + SimplyServersAPI.config.web.ports.https);
  };

  private mountRoutes = (): void => {
      const router = express.Router();

      const controlsController = new ControlsController();
      controlsController.register(router);

      this.express.use('/api/v1/', router);
  };
}
