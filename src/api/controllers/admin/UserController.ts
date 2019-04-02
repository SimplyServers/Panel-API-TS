import { Router } from "express";
import { UserModel } from "../../../schemas/UserSchema";
import { AuthMiddleware } from "../../middleware/AuthMiddleware";
import { IController } from "../IController";

export class UserController implements IController {
  public getUsers = async (req, res, next) => {
    let users;
    try {
      users = await UserModel.find({});
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
      user = await UserModel.findById(req.params.user).orFail();
    } catch (e) {
      return next(e);
    }

    return res.json({
      user
    });
  };

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
}
