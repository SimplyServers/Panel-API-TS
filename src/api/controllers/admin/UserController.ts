import { Router } from "express";
import { UserService } from "../../../services/admin/UserService";
import { AuthMiddleware } from "../../middleware/AuthMiddleware";
import { IController } from "../IController";

export class UserController implements IController {
  public getUsers = async (req, res, next) => {
    let users;
    try {
      users = await UserService.get();
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
      user = UserService.getOne(req.params.user);
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
