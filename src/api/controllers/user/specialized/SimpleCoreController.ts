import { Router } from "express";
import { IController } from "../../IController";
import { SimplecoreAuthMiddleware } from "../../../middleware/SimplecoreAuthMiddleware";
import { check } from "express-validator/check";

export class SimpleCoreController implements IController{
  public initRoutes = (router: Router): void => {
    router.post('/simplecore/createServer/', [
      SimplecoreAuthMiddleware.checkToken,
      check("preset").exists(),
      check("preset").isLength({ max: 50 }),
      check("preset").isString(),
      check("motd").exists(),
      check("motd").isLength({ max: 20 }),
      check("motd").isString(),
      check("name").exists(),
      check("name").isLength({ max: 10 }),
      check("name").isString(),
      check("name").isAlphanumeric(),
      check("owner").exists(),
      check("owner").isLength({ max: 50 }),
      check("owner").isString()
    ], this.createServer);
    router.post('/simplecore/checkUUID/', [
      SimplecoreAuthMiddleware.checkToken,
      check("uuid").exists(),
      check("uuid").isLength({ max: 50 }),
      check("uuid").isString()
    ], this.checkUUID);
    router.post('/simplecore/createEmptyUser/', [
      SimplecoreAuthMiddleware.checkToken,
      check("uuid").exists(),
      check("uuid").isLength({ max: 50 }),
      check("uuid").isString()
    ], this.createEmptyUser);
    router.post('/simplecore/:server/power/:power', [
      SimplecoreAuthMiddleware.checkToken,
      check("uuid").exists(),
      check("uuid").isLength({ max: 50 }),
      check("uuid").isString()
    ], this.serverPower);
    router.post('/simplecore/:server/remove/', [
      SimplecoreAuthMiddleware.checkToken,
      check("uuid").exists(),
      check("uuid").isLength({ max: 50 }),
      check("uuid").isString()
    ], this.removeServer);
    router.post('/simplecore/:server/reinstall', [
      SimplecoreAuthMiddleware.checkToken,
      check("uuid").exists(),
      check("uuid").isLength({ max: 50 }),
      check("uuid").isString(),
    ], this.reinstallServer);
    router.post('/simplecore/:server/executeCommand/', [
      SimplecoreAuthMiddleware.checkToken,
      check("uuid").exists(),
      check("uuid").isLength({ max: 50 }),
      check("uuid").isString(),
    ], this.executeCommand);
  };

  public createServer = (): void => {

  };

  public checkUUID = (): void => {

  };

  public createEmptyUser = (): void => {

  };

  public serverPower = (): void => {

  };

  public removeServer = (): void => {

  };

  public reinstallServer = (): void => {

  };

  public executeCommand = (): void => {

  }
}