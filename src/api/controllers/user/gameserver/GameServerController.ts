import { Router } from "express";
import { check } from "express-validator/check";
import { GameServerModel } from "../../../../schemas/GameServerSchema";
import { AuthMiddleware } from "../../../middleware/AuthMiddleware";
import { GetServerMiddleware } from "../../../middleware/GetServerMiddleware";
import { IController } from "../../IController";

export class GameserverController implements IController {
  public installPlugin = async (req, res, next) => {
    try {
      await req.server.installPlugin(req.body.plugin);
    } catch (e) {
      return next(e);
    }

    return res.json({});
  };
  public removePlugin = async (req, res, next) => {
    try {
      await req.server.removePlugin(req.body.plugin);
    } catch (e) {
      return next(e);
    }

    return res.json({});
  };
  public removeSubuser = async (req, res, next) => {
    try {
      await req.server.removeSubuser(req.body._id);
    } catch (e) {
      return next(e);
    }

    return res.json({});
  };
  public addSubuser = async (req, res, next) => {
    try {
      await req.server.addSubuser(req.body.email);
    } catch (e) {
      return next(e);
    }

    return res.json({});
  };
  public addServer = async (req, res, next) => {
    try {
      await GameServerModel.addServer({
        owner: req.payload.id,
        preset: req.body.preset,
        name: req.body.name,
        motd: req.body.motd
      }, {
        ip: req.connection.remoteAddress,
        key: req.body.captcha
      });
    } catch (e) {
      return next(e);
    }

    return res.json({});
  };
  public changePreset = async (req, res, next) => {
    try {
      await req.server.changePreset(req.body.preset);
    } catch (e) {
      return next(e);
    }

    return res.json({});
  };
  public removeServer = async (req, res, next) => {
    try {
      await req.server.removeManager();
      await req.server.delete();
    } catch (e) {
      return next(e);
    }

    return res.json({});
  };

  public initRoutes(router: Router): void {
    router.post(
      "/server/:server/changePreset",
      [
        AuthMiddleware.jwtAuth.required,
        GetServerMiddleware.serverBasicAccess,
        check("preset").exists(),
        check("preset").isLength({ max: 50 }),
        check("preset").isString()
      ],
      this.changePreset
    );
    router.post(
      "/server/:server/addSubuser",
      [
        AuthMiddleware.jwtAuth.required,
        GetServerMiddleware.serverBasicAccess,
        check("email").exists(),
        check("email").isLength({ max: 50 }),
        check("email").isEmail(),
        check("email").normalizeEmail()
      ],
      this.addSubuser
    );
    router.post(
      "/server/:server/removeSubuser",
      [
        AuthMiddleware.jwtAuth.required,
        GetServerMiddleware.serverBasicAccess,
        check("id").exists(),
        check("id").isLength({ max: 50 }),
        check("id").isString()
      ],
      this.removeSubuser
    );
    router.post(
      "/server/:server/installPlugin",
      [
        AuthMiddleware.jwtAuth.required,
        GetServerMiddleware.serverBasicAccess,
        check("plugin").exists(),
        check("plugin").isLength({ max: 50 }),
        check("plugin").isString()
      ],
      this.installPlugin
    );
    router.post(
      "/server/:server/removePlugin",
      [
        AuthMiddleware.jwtAuth.required,
        GetServerMiddleware.serverBasicAccess,
        check("plugin").exists(),
        check("plugin").isLength({ max: 50 }),
        check("plugin").isString()
      ],
      this.removePlugin
    );
    router.post(
      "/server/add",
      [
        AuthMiddleware.jwtAuth.required,
        check("captcha").exists(),
        check("captcha").isLength({ max: 80 }),
        check("captcha").isString(),
        check("preset").exists(),
        check("preset").isLength({ max: 50 }),
        check("preset").isString(),
        check("motd").exists(),
        check("motd").isLength({ max: 20 }),
        check("motd").isString(),
        check("name").exists(),
        check("name").isLength({ max: 10 }),
        check("name").isString(),
        check("name").isAlphanumeric()
      ],
      this.addServer
    );
    router.get(
      "/server/:server/remove",
      [AuthMiddleware.jwtAuth.required, GetServerMiddleware.serverOwnerAccess],
      this.removeServer
    );
  }
}
