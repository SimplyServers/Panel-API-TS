import { Router } from "express";
import { Types } from "mongoose";
import { GameServerModel } from "../../../schemas/GameServerSchema";
import { PresetModel } from "../../../schemas/PresetSchema";
import { UserModel } from "../../../schemas/UserSchema";
import { AuthMiddleware } from "../../middleware/AuthMiddleware";
import { IController } from "../IController";

export class ProfileController implements IController {
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

    // let user;
    // let presets;
    // let servers;
    // let group;
    //
    // try {
    //   const getUser = Storage.getItemByID({
    //     model: Models.UserSchema,
    //     id: Types.ObjectId(req.payload.id)
    //   });
    //   const getPresets = Storage.getAll({
    //     model: Models.PresetSchema,
    //     rule: { "special.fs": 0 }
    //   });
    //
    //   user = await getUser;
    //   presets = await getPresets;
    //
    //   // We can now get the server and group based on the previous info
    //   const getServers = Storage.getItems({
    //     model: Models.GameServerSchema,
    //     rule: { sftpPassword: 0 },
    //     condition: {
    //       $or: [
    //         {
    //           sub_owners: user._id
    //         },
    //         {
    //           owner: user._id
    //         }
    //       ]
    //     }
    //   });
    //   const getGroup = Storage.getItemByID({
    //     model: Models.GroupSchema,
    //     id: user.account_info.group
    //   });
    //
    //   group = await getGroup;
    //   servers = await getServers;
    // } catch (e) {
    //   return next(e);
    // }
    //
    // const returnServers = [];
    //
    // await Promise.all(
    //   servers.map(async server => {
    //
    //     console.log(typeof presets.find(preset => preset._id === server.preset));
    //
    //     const presetData = presets.find(preset => preset._id === server.preset);
    //
    //     if (presetData === undefined) {
    //       return; // Plugin was removed but its still affiliated with the user
    //     }
    //
    //     console.log("preset data: " + typeof presetData);
    //
    //     console.log("t1: " + typeof server.preset);
    //
    //     // Convert to plain object to values that aren't in the schema.
    //     const obsServer = server.toObject();
    //     obsServer.preset = presetData;
    //
    //     console.log("t2: " + typeof obsServer.preset);
    //
    //
    //     obsServer.isOwner = !(server.sub_owners.indexOf(user._id) > -1);
    //
    //     // Get the data for the allowSwitchingTo field.
    //     const allowSwitchingTo = [];
    //     presetData.allowSwitchingTo.map(presetSwitched => {
    //       const presetSwitchedData = presets.find(
    //         preset => preset._id === presetSwitched
    //       );
    //       if (!presetSwitchedData) {
    //         return; // PresetSchema has been removed
    //       }
    //       if (!(group.presetsAllowed.indexOf(presetSwitched) > -1)) {
    //         return; // UserSchema does not have access to preset
    //       }
    //
    //       allowSwitchingTo.push(presetSwitchedData);
    //     });
    //
    //     obsServer.preset.allowSwitchingTo = allowSwitchingTo;
    //
    //     if (server.sub_owners.length > 0) {
    //       // Get subuser usernames
    //       let subUsers;
    //       try {
    //         subUsers = await Storage.getItems({
    //           model: Models.UserSchema,
    //           condition: { id: { $all: server.sub_owners } },
    //           rule: { "account_info.username": 1 }
    //         });
    //       } catch (e) {
    //         return;
    //       }
    //
    //       // Update the sub_owners field with the proper listing
    //       obsServer.sub_owners = subUsers;
    //     }
    //
    //     // Push the finished array
    //     returnServers.push(obsServer);
    //   })
    // );
    //
    // return res.json({
    //   servers: returnServers
    // });
  };
}
