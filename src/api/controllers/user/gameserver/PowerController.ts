import { Router } from "express";
import { Storage } from "../../../../database/Storage";
import { Models } from "../../../../types/Models";
import { ActionFailed } from "../../../../util/errors/ActionFailed";
import { NodeInterface } from "../../../../util/NodeInterface";
import { AuthMiddleware } from "../../../middleware/AuthMiddleware";
import { GetServerMiddleware } from "../../../middleware/GetServerMiddleware";
import { IController } from "../../IController";

export class PowerController implements IController {
  public initRoutes(router: Router): void {
    router.get(
      "/server/:server/power/:power",
      [
        AuthMiddleware.jwtAuth.required,
        GetServerMiddleware.serverBasicAccess,
      ],
      this.setPower
    );
  }

  public setPower = async (req, res, next) => {
    // Get server
    let node;

    try {
      node = await Storage.getItem({
        model: Models.Node,
        id: req.server.nodeInstalled
      });
    } catch (e) {
      return next(e);
    }

    // Contact node
    const nodeInterface = new NodeInterface(node);

    try {
      switch (req.params.power) {
        case "on":
          await nodeInterface.powerOn(req.server);
          break;
        case "off":
          await nodeInterface.powerOff(req.server);
          break;
        case "kill":
          await nodeInterface.powerKill(req.server);
          break;
        default:
          return next(new ActionFailed("Unknown power operator.", true));
      }
    } catch (e) {
      switch (NodeInterface.niceHandle(e)) {
        case "SERVER_LOCKED":
          return next(new ActionFailed("Server is locked.", true));
        case "SERVER_NOT_OFF":
          return next(new ActionFailed("File not found.", true));
        case "REINSTALL":
          return next(new ActionFailed("Reinstall your server.", true));
        case "SERVER_NOT_RUNNING":
          return next(new ActionFailed("Server not running", true));
        case "SERVER_NOT_STOPPED":
          return next(new ActionFailed("Server not stopped", true));
        default:
          return next(new ActionFailed("Unknown error.", true));
      }
    }

    return res.json({ });
  };
}
