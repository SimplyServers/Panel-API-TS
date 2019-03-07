import { Router } from "express";
import { SimplyServersAPI } from "../../../SimplyServersAPI";
import { IController } from "../IController";

export class AnalyticsController implements IController {
  public initRoutes = (router: Router): void => {
    router.get("analytics/load", this.getStatus);
  };

  public getStatus = async (req, res, next) => {
    return res.json({
      prod: !(process.env.NODE_ENV !== "dev"),
      maxFileSize: SimplyServersAPI.config.socket.maxFileSize,
      motd: SimplyServersAPI.config.web.motd,
      codename: "fuck"
    });
  };
}
