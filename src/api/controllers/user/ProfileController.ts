import { Router } from "express";
import { Storage } from "../../../database/Storage";
import { Models } from "../../../types/Models";
import { AuthMiddleware } from "../../middleware/AuthMiddleware";
import { IController } from "../IController";

export class ProfileController implements IController {
  public initRoutes(router: Router): void {
    router.get(
      "/profile/servers",
      [AuthMiddleware.jwtAuth.required],
      this.getServers
    );
  }

  public getServers = async (req, res, next) => {
    let user;
    let presets;
    let servers;
    let group;

    try {
      const getUser = Storage.getItem({
        model: Models.User,
        id: req.payload.id
      });
      const getPresets = Storage.getAll({
        model: Models.Preset,
        rule: { "special.fs": 0 }
      });

      user = await getUser;
      presets = await getPresets;

      // We can now get the server and group based on the previous info
      const getServers = Storage.getItems({
        model: Models.GameServer,
        rule: { sftpPassword: 0 },
        condition: {
          $or: [
            {
              sub_owners: user._id
            },
            {
              owner: user._id
            }
          ]
        }
      });
      const getGroup = Storage.getItem({
        model: Models.Group,
        id: user.account_info.group
      });

      group = await getGroup;
      servers = await getServers;
    } catch (e) {
      return next(e);
    }

    const returnServers = [];

    await Promise.all(
      servers.map(async server => {
        const presetData = presets.find(preset => preset.id === server.preset);

        if (presetData === undefined) {
          return; // Plugin was removed but its still affiliated with the user
        }

        server.preset = presetData;

        // Convert to plain object to values that aren't in the schema.
        const obsServer = server.toObject();
        obsServer.isOwner = !(server.sub_owners.indexOf(user._id) > -1);

        // Get the data for the allowSwitchingTo field.
        const allowSwitchingTo = [];
        presetData.allowSwitchingTo.map(presetSwitched => {
          const presetSwitchedData = presets.find(
            preset => preset.id === presetSwitched
          );
          if (!presetSwitchedData) {
            return; // Preset has been removed
          }
          if (!(group.presetsAllowed.indexOf(presetSwitched) > -1)) {
            return; // User does not have access to preset
          }

          allowSwitchingTo.push(presetSwitchedData);
        });

        obsServer.preset.allowSwitchingTo = allowSwitchingTo;

        if (server.sub_owners.length > 0) {
          // Get subuser usernames
          let subUsers;
          try {
            subUsers = await Storage.getItems({
              model: Models.User,
              condition: { _id: { $all: server.sub_owners } },
              rule: { "account_info.username": 1 }
            });
          } catch (e) {
            return;
          }

          // Update the sub_owners field with the proper listing
          obsServer.sub_owners = subUsers;
        }

        // Push the finished array
        returnServers.push(obsServer);
      })
    );

    return res.json({
      servers: returnServers
    });
  };
}
