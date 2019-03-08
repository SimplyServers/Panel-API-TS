import { Router } from "express";
import { User } from "../../../core/admin/User";
import { UserModel } from "../../../schemas/UserSchema";
import { AuthMiddleware } from "../../middleware/AuthMiddleware";
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
      users = await User.get();
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
      user = User.getOne(req.params.user);
    } catch (e) {
      return next(e);
    }

    return res.json({
      user
    });
  };
}
