import { Router } from "express";
import { check } from "express-validator/check";
import { Storage } from "../../../../database/Storage";
import { Models } from "../../../../types/Models";
import { ActionFailed } from "../../../../util/errors/ActionFailed";
import { NodeInterface } from "../../../../util/NodeInterface";
import { AuthMiddleware } from "../../../middleware/AuthMiddleware";
import { GetServerMiddleware } from "../../../middleware/GetServerMiddleware";
import { IController } from "../../IController";

export class GameserverController implements IController{
  public initRoutes(router: Router): void {
    router.post(
      "/server/:server/changePreset",
      [
        AuthMiddleware.jwtAuth.required,
        GetServerMiddleware.serverBasicAccess,
        check("preset").exists(),
        check("preset").isLength({ max: 50 }),
        check("preset").isString()
      ],
      this.changePreset
    );
    router.get(
      "/server/:server/remove",
      [
        AuthMiddleware.jwtAuth.required,
        GetServerMiddleware.serverOwnerAccess,
      ],
      this.removeServer
    );
  };


  public changePreset = async (req, res, next) => {
    let node;
    let preset;
    let user;
    let group;
    let newPreset;

    try{
      const getUsers = Storage.getItem({
        model: Models.User,
        id: req.payload.id
      });
      const getNode = Storage.getItem({
        model: Models.Node,
        id: req.server.nodeInstalled
      });
      const getPreset = Storage.getItem({
        model: Models.Preset,
        id: req.server.preset
      });
      const getNewPreset = Storage.getItem({
        model: Models.Preset,
        id: req.body.preset
      });

      node = await getNode;
      preset = await getPreset;
      user = await getUsers;
      newPreset = await getNewPreset;

      group = await Storage.getItem({
        model: Models.Group,
        id: user.account_info.group
      })

    }catch (e) {
      return next(e);
    }

    // Check to see if preset is compatible.
    if (!(preset.allowSwitchingTo.indexOf(req.body.preset) > -1)) {
      return next(new ActionFailed('Preset not allowed.', true));
    }

    if (!(group.presetsAllowed.indexOf(req.body.preset) > -1)) {
      return next(new ActionFailed("You don't have permissions.", true));
    }

    if (req.body.preset === req.server.preset) {
      return next(new ActionFailed('This is already your preset.', true));
    }

    // Contact node
    const nodeInterface = new NodeInterface(node);

    try{
      await nodeInterface.edit(req.server, JSON.stringify({
        build: {
          io: newPreset.build.io,
          mem: newPreset.build.mem,
          cpu: newPreset.build.cpu
        },
        players: newPreset.maxPlayers,
        game: newPreset.game
      }));
    }catch (e) {
      switch (NodeInterface.niceHandle(e)) {
        case "SERVER_LOCKED":
          return next(new ActionFailed("Server is locked.", true));
        case "SERVER_NOT_OFF":
          return next(new ActionFailed("Server is not off", true));
        default:
          return next(new ActionFailed("Unknown error.", true));
      }
    }

    req.server.preset = req.body.preset;

    try {
      await req.server.save();
    } catch (e) {
      return next(new ActionFailed('Failed save server.', false));
    }

    return res.json({});
  };

  public removeServer = async (req, res, next) => {
    let node;
    try{
      node = await Storage.getItem({
        model: Models.Node,
        id: req.server.nodeInstalled
      });
    }catch (e) {
      return next(e);
    }

    // Contact node
    const nodeInterface = new NodeInterface(node);

    try{
      await nodeInterface.remove(req.server);
    }catch (e) {
      switch (NodeInterface.niceHandle(e)) {
        case "SERVER_LOCKED":
          return next(new ActionFailed("Server is locked.", true));
        case "SERVER_NOT_OFF":
          return next(new ActionFailed("Server is not off", true));
        default:
          return next(new ActionFailed("Unknown error.", true));
      }
    }

    try{
      req.server.remove();
    }catch (e) {
      return next(new ActionFailed('Failed remove server.', false));
    }

    return res.json({});
  };

}
