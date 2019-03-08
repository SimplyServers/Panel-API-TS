import { Router } from "express";

import { check, validationResult } from "express-validator/check";
import { ServerNodeModel } from "../../../../schemas/ServerNodeSchema";
import { ActionFailed } from "../../../../util/errors/ActionFailed";
import { ValidationError } from "../../../../util/errors/ValidationError";
import { NodeInterface } from "../../../../util/NodeInterface";
import { AuthMiddleware } from "../../../middleware/AuthMiddleware";
import { GetServerMiddleware } from "../../../middleware/GetServerMiddleware";
import { IController } from "../../IController";

export class ControlsController implements IController {
  public initRoutes = (router: Router) => {
    router.post(
      "/server/:server/control/command",
      [
        AuthMiddleware.jwtAuth.required,
        GetServerMiddleware.serverBasicAccess,
        check("command").exists(),
        check("command").isLength({ max: 50 }),
        check("command").isString()
      ],
      this.executeCommand
    );
    router.get(
      "/server/:server/control/install",
      [AuthMiddleware.jwtAuth.required, GetServerMiddleware.serverBasicAccess],
      this.install
    );
    router.get(
      "/server/:server/control/reinstall",
      [AuthMiddleware.jwtAuth.required, GetServerMiddleware.serverBasicAccess],
      this.reinstall
    );
  };

  public executeCommand = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationError(errors.array()));
    }

    const nodeInterface = new NodeInterface(req.server._nodeInstalled);
    try {
      await nodeInterface.execute(req.server, req.body.command);
      return res.json({});
    } catch (e) {
      switch (NodeInterface.niceHandle(e)) {
        case "SERVER_NOT_OFF":
          return next(new ActionFailed("Server not off.", true));
        default:
          return next(new ActionFailed("Unknown error.", true));
      }
    }
  };

  public install = async (req, res, next) => {
    const nodeInterface = new NodeInterface(req.server._nodeInstalled);
    try {
      await nodeInterface.install(req.server);
      return res.json({});
    } catch (e) {
      switch (NodeInterface.niceHandle(e)) {
        case "SERVER_LOCKED":
          return next(new ActionFailed("Server is locked.", true));
        case "REINSTALL_INSTEAD":
          return next(new ActionFailed("Reinstall your server instead.", true));
        case "SERVER_NOT_OFF":
          return next(new ActionFailed("Server not off.", true));
        default:
          return next(new ActionFailed("Unknown error.", true));
      }
    }
  };

  public reinstall = async (req, res, next) => {
    const nodeInterface = new NodeInterface(req.server._nodeInstalled);
    try {
      await nodeInterface.reinstall(req.server);
      return res.json({});
    } catch (e) {
      switch (NodeInterface.niceHandle(e)) {
        case "SERVER_LOCKED":
          return next(new ActionFailed("Server is locked.", true));
        case "INSTALL_INSTEAD":
          return next(new ActionFailed("Install your server instead.", true));
        case "SERVER_NOT_OFF":
          return next(new ActionFailed("Server not off.", true));
        default:
          return next(new ActionFailed("Unknown error.", true));
      }
    }
  };
}
