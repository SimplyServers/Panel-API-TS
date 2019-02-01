import { Router } from "express";
import { Storage } from "../../../database/storage";
import { Models } from "../../../types/models";
import { AuthMiddleware } from "../../middleware/auth";
import { IController } from "../IController";

export class UserController implements IController {
  public initRoutes(router: Router): void {
    router.get(
      "/user/:user/",
      [AuthMiddleware.jwtAuth.required, AuthMiddleware.isAdmin],
      this.getUser
    );
    router.get(
      "/user/",
      [AuthMiddleware.jwtAuth.required, AuthMiddleware.isAdmin],
      this.getUsers
    );
  }

  public getUsers = async (req, res, next) => {
    let users;
    try {
      users = await Storage.getAll(Models.User, {"acocunt_info.password": 0});
    } catch (e) {
      return next(e);
    }

    return res.json({
      users
    });
  };

  public getUser = async (req, res, next) => {
    let user;
    try {
      user = await Storage.getItem(Models.User, req.params.user);
    } catch (e) {
      return next(e);
    }

    return res.json({
      user
    });
  };
}
