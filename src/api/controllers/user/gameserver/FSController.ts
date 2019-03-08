import { Router } from "express";
import { check, validationResult } from "express-validator/check";
import PresetSchema from "../../../../schemas/PresetSchema";
import { ActionFailed } from "../../../../util/errors/ActionFailed";
import { ValidationError } from "../../../../util/errors/ValidationError";
import { NodeInterface } from "../../../../util/NodeInterface";
import { AuthMiddleware } from "../../../middleware/AuthMiddleware";
import { GetServerMiddleware } from "../../../middleware/GetServerMiddleware";
import { IController } from "../../IController";

import * as path from "path";

export class FSController implements IController {
  public static checkViolations = (cPath: string, preset: PresetSchema) => {
    // The path should always start with a /
    if (!cPath.startsWith("/")) {
      cPath = "/" + cPath;
    }

    // The path should never end with a /
    if (cPath.endsWith("/")) {
      cPath = cPath.slice(0, -1);
    }

    // Check to ensure we're not violating any fs rules
    return preset.special.fs.find(rule => rule.path === cPath) === undefined;
  };
  public initRoutes(router: Router): void {
    router.post(
      "/server/:server/fs/checkAllowed",
      [
        AuthMiddleware.jwtAuth.required,
        GetServerMiddleware.serverBasicAccess,
        check("path").exists(),
        check("path").isLength({ max: 50 }),
        check("path").isString()
      ],
      this.checkPath
    );
    router.post(
      "/server/:server/fs/writeFile",
      [
        AuthMiddleware.jwtAuth.required,
        GetServerMiddleware.serverBasicAccess,
        check("path").exists(),
        check("path").isLength({ max: 50 }),
        check("path").isString(),
        check("contents").exists(),
        check("contents").isLength({ max: 10000 }),
        check("contents").isString()
      ],
      this.writeFile
    );
    router.post(
      "/server/:server/fs/removeFile",
      [
        AuthMiddleware.jwtAuth.required,
        GetServerMiddleware.serverBasicAccess,
        check("path").exists(),
        check("path").isLength({ max: 50 }),
        check("path").isString()
      ],
      this.removeFile
    );
    router.post(
      "/server/:server/fs/removeFolder",
      [
        AuthMiddleware.jwtAuth.required,
        GetServerMiddleware.serverBasicAccess,
        check("path").exists(),
        check("path").isLength({ max: 50 }),
        check("path").isString()
      ],
      this.removeFolder
    );
    router.post(
      "/server/:server/fs/fileContents",
      [
        AuthMiddleware.jwtAuth.required,
        GetServerMiddleware.serverBasicAccess,
        check("path").exists(),
        check("path").isLength({ max: 50 }),
        check("path").isString()
      ],
      this.fileContents
    );
    router.post(
      "/server/:server/fs/listDir",
      [
        AuthMiddleware.jwtAuth.required,
        GetServerMiddleware.serverBasicAccess,
        check("path").exists(),
        check("path").isLength({ max: 50 }),
        check("path").isString()
      ],
      this.listDir
    );
  }

  public checkPath = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationError(errors.array()));
    }

    // Normalize path so users don't fuck with us
    const nPath = path.normalize(req.body.path);

    // This removes the tailing/leading slash if its present
    // TODO: double check all conditions
    if (!FSController.checkViolations(nPath, req.server._preset)) {
      return next(new ActionFailed("Restricted file target.", false));
    }

    // Contact node
    const nodeInterface = new NodeInterface(req.server._nodeInstalled);

    let data;
    try {
      data = await nodeInterface.checkAllowed(req.server, req.body.path);
    } catch (e) {
      switch (NodeInterface.niceHandle(e)) {
        case "SERVER_LOCKED":
          return next(new ActionFailed("Server is locked.", true));
        case "FILE_NOT_FOUND":
          return next(new ActionFailed("File not found.", true));
        default:
          return next(new ActionFailed("Unknown error.", true));
      }
    }

    return res.json({ allowed: data.allowed });
  };

  public writeFile = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationError(errors.array()));
    }

    // Normalize path so users don't fuck with us
    const nPath = path.normalize(req.body.path);

    // This removes the tailing/leading slash if its present
    // TODO: double check all conditions
    if (!FSController.checkViolations(nPath, req.server._preset)) {
      return next(new ActionFailed("Restricted file target.", false));
    }

    // Contact node
    const nodeInterface = new NodeInterface(req.server._nodeInstalled);

    try {
      await nodeInterface.createFile(
        req.server,
        req.body.path,
        req.body.contents
      );
    } catch (e) {
      switch (NodeInterface.niceHandle(e)) {
        case "SERVER_LOCKED":
          return next(new ActionFailed("Server is locked.", true));
        case "FILE_NOT_FOUND":
          return next(new ActionFailed("File not found.", true));
        default:
          return next(new ActionFailed("Unknown error.", true));
      }
    }

    return res.json({});
  };

  public removeFile = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationError(errors.array()));
    }

    // Normalize path so users don't fuck with us
    const nPath = path.normalize(req.body.path);

    // This removes the tailing/leading slash if its present
    // TODO: double check all conditions
    if (!FSController.checkViolations(nPath, req.server._preset)) {
      return next(new ActionFailed("Restricted file target.", false));
    }

    // Contact node
    const nodeInterface = new NodeInterface(req.server._nodeInstalled);

    try {
      await nodeInterface.removeFile(req.server, req.body.path);
    } catch (e) {
      switch (NodeInterface.niceHandle(e)) {
        case "SERVER_LOCKED":
          return next(new ActionFailed("Server is locked.", true));
        case "FILE_NOT_FOUND":
          return next(new ActionFailed("File not found.", true));
        default:
          return next(new ActionFailed("Unknown error.", true));
      }
    }

    return res.json({});
  };

  public removeFolder = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationError(errors.array()));
    }

    // Normalize path so users don't fuck with us
    const nPath = path.normalize(req.body.path);

    // This removes the tailing/leading slash if its present
    // TODO: double check all conditions
    if (!FSController.checkViolations(nPath, req.server._preset)) {
      return next(new ActionFailed("Restricted file target.", false));
    }

    // Contact node
    const nodeInterface = new NodeInterface(req.server._nodeInstalled);

    try {
      await nodeInterface.removeFolder(req.server, req.body.path);
    } catch (e) {
      switch (NodeInterface.niceHandle(e)) {
        case "SERVER_LOCKED":
          return next(new ActionFailed("Server is locked.", true));
        case "FILE_NOT_FOUND":
          return next(new ActionFailed("File not found.", true));
        default:
          return next(new ActionFailed("Unknown error.", true));
      }
    }

    return res.json({});
  };

  public fileContents = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationError(errors.array()));
    }

    // Normalize path so users don't fuck with us
    const nPath = path.normalize(req.body.path);

    // This removes the tailing/leading slash if its present
    // TODO: double check all conditions
    if (!FSController.checkViolations(nPath, req.server._preset)) {
      return next(new ActionFailed("Restricted file target.", false));
    }

    // Contact node
    const nodeInterface = new NodeInterface(req.server._nodeInstalled);

    let data;
    try {
      data = await nodeInterface.fileContents(req.server, req.body.path);
    } catch (e) {
      switch (NodeInterface.niceHandle(e)) {
        case "SERVER_LOCKED":
          return next(new ActionFailed("Server is locked.", true));
        case "FILE_NOT_FOUND":
          return next(new ActionFailed("File not found.", true));
        default:
          return next(new ActionFailed("Unknown error.", true));
      }
    }

    return res.json({ contents: data.contents });
  };

  public listDir = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationError(errors.array()));
    }

    // Normalize path so users don't fuck with us
    const nPath = path.normalize(req.body.path);

    // This removes the tailing/leading slash if its present
    // TODO: double check all conditions
    if (!FSController.checkViolations(nPath, req.server._preset)) {
      return next(new ActionFailed("Restricted file target.", false));
    }

    // Contact node
    const nodeInterface = new NodeInterface(req.server._nodeInstalled);

    let data;
    try {
      data = await nodeInterface.getDir(req.server, req.body.path);
    } catch (e) {
      switch (NodeInterface.niceHandle(e)) {
        case "SERVER_LOCKED":
          return next(new ActionFailed("Server is locked.", true));
        case "FILE_NOT_FOUND":
          return next(new ActionFailed("File not found.", true));
        default:
          return next(new ActionFailed("Unknown error.", true));
      }
    }

    const files = [];
    data.contents.forEach(value => {
      if (
        req.server._preset.special.fs.find(rule => {
          return rule.path === path.join(nPath, value.name) && !rule.canSee;
        }) === undefined
      ) {
        files.push(value);
      }
    });

    return res.json({ files });
  };
}
