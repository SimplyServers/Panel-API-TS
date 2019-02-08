import { Router } from "express";

import { check, validationResult } from "express-validator/check";
import { Storage } from "../../../../database/Storage";
import { Models } from "../../../../types/Models";
import { ActionFailed } from "../../../../util/errors/ActionFailed";
import { ValidationError } from "../../../../util/errors/ValidationError";
import { NodeInterface } from "../../../../util/NodeInterface";
import { AuthMiddleware } from "../../../middleware/AuthMiddleware";
import { GetServerMiddleware } from "../../../middleware/GetServerMiddleware";
import { IController } from "../../IController";

export class ControlsController implements IController{
  public initRoutes = (router: Router) => {
    router.post('/server/:server/control/command', [
      AuthMiddleware.jwtAuth.required,
      GetServerMiddleware.serverBasicAccess,
      check("command").exists(),
      check('command').isLength({max: 50}),
      check('command').isString()
    ], this.executeCommand);
    router.post('/server/:server/control/install', [
      AuthMiddleware.jwtAuth.required, GetServerMiddleware.serverBasicAccess
    ], this.install);
    router.post('/server/:server/control/reinstall', [
      AuthMiddleware.jwtAuth.required, GetServerMiddleware.serverBasicAccess
    ], this.reinstall);
  };

  public executeCommand = async (req, res, next) => {
      const errors = validationResult(req);
      if(!errors.isEmpty()) {
        return next(new ValidationError(errors.array()));
      }

      let node;
      try{
        node = await Storage.getItem({
          model: Models.Node,
          id: req.server.nodeInstalled
        });
      }catch (e) {
        return next(e);
      }

      const nodeInterface = new NodeInterface(node);
      try{
        await nodeInterface.execute(req.server, req.body.command);
      }catch (e) {
        switch (NodeInterface.niceHandle(e)) {
          case 'SERVER_NOT_OFF':
            return next(new ActionFailed("Server not off.", true));
          default:
            return next(new ActionFailed("Unknown error.", true));
        }
      }
  };

  public install = async (req, res, next) => {
    let node;
    try{
      node = await Storage.getItem({
        model: Models.Node,
        id: req.server.nodeInstalled
      });
    }catch (e) {
      return next(e);
    }

    const nodeInterface = new NodeInterface(node);
    try{
      await nodeInterface.install(req.server);
    }catch (e) {
      switch (NodeInterface.niceHandle(e)) {
        case 'SERVER_LOCKED':
          return next(new ActionFailed("Server is locked.", true));
        case 'REINSTALL_INSTEAD':
          return next(new ActionFailed("Reinstall your server instead.", true));
        case 'SERVER_NOT_OFF':
          return next(new ActionFailed("Server not off.", true));
        default:
          return next(new ActionFailed("Unknown error.", true));
      }
    }
  };

  public reinstall = async (req, res, next) => {
    let node;
    try{
      node = await Storage.getItem({
        model: Models.Node,
        id: req.server.nodeInstalled
      });
    }catch (e) {
      return next(e);
    }

    const nodeInterface = new NodeInterface(node);
    try{
      await nodeInterface.reinstall(req.server);
    }catch (e) {
      switch (NodeInterface.niceHandle(e)) {
        case 'SERVER_LOCKED':
          return next(new ActionFailed("Server is locked.", true));
        case 'INSTALL_INSTEAD':
          return next(new ActionFailed("Install your server instead.", true));
        case 'SERVER_NOT_OFF':
          return next(new ActionFailed("Server not off.", true));
        default:
          return next(new ActionFailed("Unknown error.", true));
      }
    }
  };
}
