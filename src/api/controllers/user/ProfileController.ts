import { Router } from "express";
import { Types } from "mongoose";
import { UserModel } from "../../../schemas/UserSchema";
import { AuthMiddleware } from "../../middleware/AuthMiddleware";
import { IController } from "../IController";

export class ProfileController implements IController {
  public profile = async (req, res, next) => {
    let user;
    try {
      user = await UserModel.findById(Types.ObjectId(req.payload.id), {
        "account_info.password": 0,
        "account_info.resetPassword": 0
      }).orFail();
    } catch (e) {
      return next(e);
    }

    return res.json({ user });
  };
  public getPresets = async (req, res, next) => {
    let user;
    try {
      user = await UserModel.findById(Types.ObjectId(req.payload.id));
    } catch (e) {
      return next(e);
    }

    return res.json({
      presets: await user.getPresets()
    });
  };
  public getServers = async (req, res, next) => {
    let user;
    try {
      user = await UserModel.findById(Types.ObjectId(req.payload.id));
      return res.json({ servers: await user.getServers() });
    } catch (e) {
      return next(e);
    }
  };

  public initRoutes(router: Router): void {
    router.get(
      "/profile/servers",
      [AuthMiddleware.jwtAuth.required],
      this.getServers
    );
    router.get("/profile", [AuthMiddleware.jwtAuth.required], this.profile);
    router.get(
      "/profile/presets",
      [AuthMiddleware.jwtAuth.required],
      this.getPresets
    );
  }
}
