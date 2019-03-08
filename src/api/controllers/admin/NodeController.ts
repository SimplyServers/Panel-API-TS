import { Router } from "express";
import { check, validationResult } from "express-validator/check";
import { ServerNode } from "../../../core/admin/Node";
import Node, { ServerNodeModel } from "../../../schemas/ServerNodeSchema";
import { ActionFailed } from "../../../util/errors/ActionFailed";
import { ValidationError } from "../../../util/errors/ValidationError";
import { AuthMiddleware } from "../../middleware/AuthMiddleware";
import { IController } from "../IController";

export class NodeController implements IController {
  public initRoutes(router: Router): void {
    router.post(
      "/node/add",
      [
        AuthMiddleware.jwtAuth.required,
        AuthMiddleware.isAdmin,
        check("ip")
          .exists()
          .isIP(),
        check("name")
          .exists()
          .isString()
          .isLength({ max: 30 }),
        check("secret")
          .exists()
          .isString()
          .isLength({ max: 50 }),
        check("port")
          .exists()
          .isPort()
      ],
      this.addNode
    );
    router.post(
      "/node/:node/edit",
      [
        AuthMiddleware.jwtAuth.required,
        AuthMiddleware.isAdmin,
        check("ip")
          .exists()
          .isIP(),
        check("name")
          .exists()
          .isString()
          .isLength({ max: 30 }),
        check("secret")
          .exists()
          .isString()
          .isLength({ max: 50 }),
        check("port")
          .exists()
          .isPort()
      ],
      this.editNode
    );
    router.get(
      "/node/:node/remove",
      [AuthMiddleware.jwtAuth.required, AuthMiddleware.isAdmin],
      this.removeNode
    );
    router.get(
      "/node/:node/",
      [AuthMiddleware.jwtAuth.required, AuthMiddleware.isAdmin],
      this.getNode
    );
    router.get(
      "/node/",
      [AuthMiddleware.jwtAuth.required, AuthMiddleware.isAdmin],
      this.getNodes
    );
  }
  public getNodes = async (req, res, next) => {
    let nodes;
    try {
      nodes = await ServerNode.get();
    } catch (e) {
      return next(e);
    }

    return res.json({
      nodes
    });
  };

  public getNode = async (req, res, next) => {
    let node;
    try {
      node = await ServerNodeModel.findById(req.params.node).orFail();
    } catch (e) {
      return next(e);
    }

    return res.json({
      node
    });
  };

  public removeNode = async (req, res, next) => {
    try {
      await ServerNode.remove(req.params.node);
    } catch (e) {
      return next(e);
    }

    return res.json({});
  };

  public editNode = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationError(errors.array()));
    }

    await ServerNode.edit({
      ip: req.body.ip,
      name: req.body.name,
      secret: req.body.secret,
      port: req.body.port,
      _id: req.params.node
    });
  };

  public addNode = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationError(errors.array()));
    }

    await ServerNode.add({
      ip: req.body.ip,
      name: req.body.name,
      secret: req.body.secret,
      port: req.body.port
    });

    return res.json({});
  };
}
