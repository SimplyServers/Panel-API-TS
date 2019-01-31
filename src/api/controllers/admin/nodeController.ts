import { Router } from "express";
import { check, validationResult } from "express-validator/check";
import Node from "../../../database/models/node";
import { Storage } from "../../../database/storage";
import { Models } from "../../../types/models";
import { ActionFailed } from "../../../util/errors/ActionFailed";
import { ValidationError } from "../../../util/errors/ValidationError";
import { AuthMiddleware } from "../../middleware/auth";
import { IController } from "../IController";

export class NodeController implements IController {
  public initRoutes(router: Router): void {
    router.post(
      "/node/add",
      [
        AuthMiddleware.jwtAuth.required,
        AuthMiddleware.isAdmin,
        check("ip").exists().isIP(),
        check("name").exists().isString().isLength({ max: 30 }),
        check("secret").exists().isString().isLength({ max: 50 }),
        check("port").exists().isPort()
      ],
      this.addNode
    );
    router.post(
      "/node/:node/edit",
      [
        AuthMiddleware.jwtAuth.required,
        AuthMiddleware.isAdmin,
        check("ip").exists().isIP(),
        check("name").exists().isString().isLength({ max: 30 }),
        check("secret").exists().isString().isLength({ max: 50 }),
        check("port").exists().isPort()
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
      nodes = await Storage.getAll(Models.Node);
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
      node = await Storage.getItem(Models.Node, req.params.node);
    } catch (e) {
      return next(e);
    }

    return res.json({
      node
    });
  };

  public removeNode = async (req, res, next) => {
    let node;
    try {
      node = await Storage.removeItem(Models.Node, req.params.node);
    } catch (e) {
      return next(e);
    }

    // Make sure we removed more then 0
    if (node.n < 1) {
      return next(new ActionFailed("Failed to find node matching id", true));
    }

    return res.json({});
  };

  public editNode = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationError(errors.array()));
    }

    // Make sure the name isn't already assigned
    let existingNodes;
    try {
      existingNodes = await Storage.getItems(Models.Node, {
        name: req.body.name
      });
    } catch (e) {
      return next(e);
    }

    if (existingNodes.length !== 0) {
      // This is expected to be 1, especially if they aren't changing the name
      console.log("ext:" + JSON.stringify(existingNodes[0]));
      if (existingNodes[0]._id.toString() !== req.params.node) {
        // Only fire this if the node we're editing is NOT this
        return next(new ActionFailed("Name already assigned to node.", true));
      }
    } else {
      return next(new ActionFailed("Failed to find node matching id", true));
    }

    const existingNode = existingNodes[0];

    existingNode.ip = req.body.ip;
    existingNode.name = req.body.name;
    existingNode.secret = req.body.secret;
    existingNode.port = req.body.port;

    try {
      await existingNode.save();
    } catch (e) {
      return next(new ActionFailed("Failed to save node.", false));
    }

    return res.json({
      node: existingNode
    });
  };

  public addNode = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationError(errors.array()));
    }

    // Make sure the name isn't already assigned
    let existingNodes;
    try {
      existingNodes = await Storage.getItems(Models.Node, {
        name: req.body.name
      });
    } catch (e) {
      return next(new ActionFailed("Failed checking existing nodes.", false));
    }
    if (existingNodes.length !== 0) {
      return next(new ActionFailed("Name already assigned to node.", true));
    }

    // Create the user
    const NodeModal = new Node().getModelForClass(Node);

    const newNode = new NodeModal({
      ip: req.body.ip,
      name: req.body.name,
      secret: req.body.secret,
      port: req.body.port
    });

    try {
      await newNode.save();
    } catch (e) {
      return next(new ActionFailed("Failed to save node.", false));
    }

    return res.json({
      node: newNode
    });
  };
}
