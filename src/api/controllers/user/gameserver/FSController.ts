import { Router } from "express";
import { check, validationResult } from "express-validator/check";
import PresetSchema from "../../../../schemas/PresetSchema";
import { FilesystemService } from "../../../../services/gameserver/FilesystemService";
import { ValidationError } from "../../../../util/errors/ValidationError";
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
  public checkPath = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationError(errors.array()));
    }

    try {
      return res.json({ allowed: await FilesystemService.checkPath(req.server, req.body.path) });
    } catch (e) {
      return next(e);
    }
  };
  public writeFile = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationError(errors.array()));
    }

    try {
      await FilesystemService.writeFile(req.server, req.body.path, req.body.contents);
    } catch (e) {
      return next(e);
    }

    return res.json({});
  };
  public removeFile = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationError(errors.array()));
    }

    try {
      await FilesystemService.removeFile(req.server, req.body.path);
    } catch (e) {
      return next(e);
    }

    return res.json({});
  };
  public removeFolder = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationError(errors.array()));
    }

    try {
      await FilesystemService.removeFolder(req.server, req.body.path);
    } catch (e) {
      return next(e);
    }

    return res.json({});
  };
  public fileContents = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationError(errors.array()));
    }

    try {
      return res.json({ contents: await FilesystemService.fileContents(req.server, req.body.path) });
    } catch (e) {
      return next(e);
    }
  };
  public listDir = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationError(errors.array()));
    }

    return res.json({ files: await FilesystemService.listDir(req.server, req.body.path) });
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
}
