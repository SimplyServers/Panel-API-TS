import { Router } from "express";
import { IController } from "../../IController";
import { SimplecoreAuthMiddleware } from "../../../middleware/SimplecoreAuthMiddleware";

export class SimpleCoreController implements IController{
  public initRoutes = (router: Router): void => {
    router.post('/simplecore/createServer/', [
      SimplecoreAuthMiddleware.checkToken
    ], this.createServer);
    router.post('/simplecore/checkUUID/', [
      SimplecoreAuthMiddleware.checkToken
    ], this.checkUUID);
    router.post('/simplecore/createEmptyUser/', [
      SimplecoreAuthMiddleware.checkToken
    ], this.createEmptyUser);
    router.post('/simplecore/serverPower/', [
      SimplecoreAuthMiddleware.checkToken
    ], this.serverPower);
    router.post('/simplecore/createServer/', [
      SimplecoreAuthMiddleware.checkToken
    ], this.removeServer);
    router.post('/simplecore/reinstallServer/', [
      SimplecoreAuthMiddleware.checkToken
    ], this.reinstallServer);
    router.post('/simplecore/executeCommand/', [
      SimplecoreAuthMiddleware.checkToken
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