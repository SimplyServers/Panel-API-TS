import { Router } from "express";
import { Types } from "mongoose";
import { GameServerModel } from "../../../schemas/GameServerSchema";
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
      presets: user._group._presetsAllowed
    });
  };
  public getServers = async (req, res, next) => {
    let user;
    let servers;
    try {
      user = await UserModel.findById(Types.ObjectId(req.payload.id));

      servers = await GameServerModel.find(
        {
          $or: [
            {
              _sub_owners: Types.ObjectId(user._id)
            },
            {
              _owner: Types.ObjectId(user._id)
            }
          ]
        },
        "-sftpPassword"
      );
    } catch (e) {
      return next(e);
    }
    servers = servers.map(server => {
      server._preset.special.fs = undefined;
      return server;
    });

    return res.json({ servers });
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
