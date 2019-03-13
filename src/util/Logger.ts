import * as path from "path";
import * as winston from "winston";
import { SimplyServersAPI } from "../SimplyServersAPI";

class Logger {
  public info = (message: string): void => {
    this.logger.info("[Info] " + message);
  };
  public verbose = (message: string): void => {
    this.logger.debug("[Verbose] " + message);
  };
  public error = (message: string): void => {
    this.logger.error("[Verbose] " + message);
  };
  private logger;

  constructor(logToFile: boolean) {
    const options = {
      file: {
        level: "info",
        filename: path.join(SimplyServersAPI.getRoot(), "../app.log"),
        handleExceptions: true,
        json: true,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        colorize: false
      },
      console: {
        level: "debug",
        handleExceptions: true,
        json: false,
        colorize: true
      }
    };

    let loggerTransports;
    if (logToFile) {
      loggerTransports = [
        new winston.transports.File(options.file),
        new winston.transports.Console(options.console)
      ];
    } else {
      loggerTransports = [new winston.transports.Console(options.console)];
    }

    this.logger = winston.createLogger({
      transports: loggerTransports,
      exitOnError: false
    });
  }
}

export { Logger };
