import { Router } from "express";
import { AuthMiddleware } from "../../../middleware/AuthMiddleware";
import { GetServerMiddleware } from "../../../middleware/GetServerMiddleware";
import { IController } from "../../IController";

export class PowerController implements IController {
  public setPower = async (req, res, next) => {
    try {
      await req.server.getPowerHelper().setPower(req.params.power);
    } catch (e) {
      return next(e);
    }

    return res.json({});
  };

  public initRoutes(router: Router): void {
    router.get(
      "/server/:server/power/:power",
      [AuthMiddleware.jwtAuth.required, GetServerMiddleware.serverBasicAccess],
      this.setPower
    );
  }
}
