import { Router } from "express";

import { check, validationResult } from "express-validator/check";
import { ValidationError } from "../../../../util/errors/ValidationError";
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

    try {
      await req.server.getControlsHelper().executeCommand(req.body.command);
    } catch (e) {
      return next(e);
    }

    return res.json({});
  };

  public install = async (req, res, next) => {
    try {
      await req.server.getControlsHelper().install();
    } catch (e) {
      return next(e);
    }

    return res.json({});
  };

  public reinstall = async (req, res, next) => {
    try {
      await req.server.getControlsHelper().reinstall();
    } catch (e) {
      return next(e);
    }

    return res.json({});
  };
}
