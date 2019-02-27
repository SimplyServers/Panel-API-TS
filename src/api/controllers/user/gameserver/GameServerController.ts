import { Router } from "express";
import { check } from "express-validator/check";
import { Types } from "mongoose";
import GameServer, { GameServerModel } from "../../../../database/GameServer";
import MinecraftProperties from "../../../../database/MinecraftProperties";
import { PresetModel } from "../../../../database/Preset";
import Node, { ServerNodeModel } from "../../../../database/ServerNode";
import { UserModel } from "../../../../database/User";
import { SimplyServersAPI } from "../../../../SimplyServersAPI";
import { Captcha } from "../../../../util/Captcha";
import { ActionFailed } from "../../../../util/errors/ActionFailed";
import { ValidationError } from "../../../../util/errors/ValidationError";
import { NodeInterface } from "../../../../util/NodeInterface";
import { Util } from "../../../../util/Util";
import { AuthMiddleware } from "../../../middleware/AuthMiddleware";
import { GetServerMiddleware } from "../../../middleware/GetServerMiddleware";
import { IController } from "../../IController";

export class GameserverController implements IController {
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
    router.post(
      "/server/:server/addSubuser",
      [
        AuthMiddleware.jwtAuth.required,
        GetServerMiddleware.serverBasicAccess,
        check("email").exists(),
        check("email").isLength({ max: 50 }),
        check("email").isEmail(),
        check("email").normalizeEmail()
      ],
      this.addSubuser
    );
    router.post(
      "/server/:server/removeSubuser",
      [
        AuthMiddleware.jwtAuth.required,
        GetServerMiddleware.serverBasicAccess,
        check("id").exists(),
        check("id").isLength({ max: 50 }),
        check("id").isString()
      ],
      this.removeSubuser
    );
    router.post(
      "/server/:server/installPlugin",
      [
        AuthMiddleware.jwtAuth.required,
        GetServerMiddleware.serverBasicAccess,
        check("plugin").exists(),
        check("plugin").isLength({ max: 50 }),
        check("plugin").isString()
      ],
      this.installPlugin
    );
    router.post(
      "/server/:server/removePlugin",
      [
        AuthMiddleware.jwtAuth.required,
        GetServerMiddleware.serverBasicAccess,
        check("plugin").exists(),
        check("plugin").isLength({ max: 50 }),
        check("plugin").isString()
      ],
      this.removePlugin
    );
    router.post(
      "/server/add",
      [
        AuthMiddleware.jwtAuth.required,
        check("captcha").exists(),
        check("captcha").isLength({ max: 80 }),
        check("captcha").isString(),
        check("preset").exists(),
        check("preset").isLength({ max: 50 }),
        check("preset").isString(),
        check("motd").exists(),
        check("motd").isLength({ max: 20 }),
        check("motd").isString(),
        check("name").exists(),
        check("name").isLength({ max: 10 }),
        check("name").isString(),
        check("name").isAlphanumeric()
      ],
      this.addServer
    );
    router.get(
      "/server/:server/remove",
      [AuthMiddleware.jwtAuth.required, GetServerMiddleware.serverOwnerAccess],
      this.removeServer
    );
  }

  public installPlugin = async (req, res, next) => {
    // Contact node
    const nodeInterface = new NodeInterface(req.server._nodeInstalled);

    try {
      await nodeInterface.installPlugin(req.server, req.body.plugin);
    } catch (e) {
      switch (NodeInterface.niceHandle(e)) {
        case "PLUGIN_INSTALLED":
          return next(new ActionFailed("Plugin already installed.", true));
        case "INVALID_PLUGIN":
          return next(new ActionFailed("Plugin does not exist.", true));
        case "PLUGIN_NOT_SUPPORTED":
          return next(new ActionFailed("Plugin not supported.", true));
        case "SERVER_NOT_OFF":
          return next(new ActionFailed("Server is not off.", true));
        case "SERVER_LOCKED":
          return next(new ActionFailed("Server is locked.", true));
        default:
          return next(new ActionFailed("Unknown error.", true));
      }
    }

    return res.json({});
  };

  public removePlugin = async (req, res, next) => {
    // Contact node
    const nodeInterface = new NodeInterface(req.server._nodeInstalled);

    try {
      await nodeInterface.removePlugin(req.server, req.body.plugin);
    } catch (e) {
      switch (NodeInterface.niceHandle(e)) {
        case "PLUGIN_NOT_INSTALLED":
          return next(new ActionFailed("Plugin is not installed.", true));
        case "SERVER_NOT_OFF":
          return next(new ActionFailed("Server is not off.", true));
        case "SERVER_LOCKED":
          return next(new ActionFailed("Server is locked.", true));
        default:
          return next(new ActionFailed("Unknown error.", true));
      }
    }

    return res.json({});
  };

  public removeSubuser = async (req, res, next) => {
    let targetUser;
    try {
      targetUser = await UserModel.findById(req.body._id);
    } catch (e) {
      return next(e);
    }

    req.server._sub_owners.filter(subOwner => subOwner._id !== targetUser._id);

    try {
      await req.server.save();
    } catch (e) {
      return next(new ActionFailed("Failed save server.", false));
    }

    return res.json({});
  };

  public addSubuser = async (req, res, next) => {
    let targetUser;
    try {
      targetUser = await UserModel.findOne({
        "account_info.email": req.body.email
      });
    } catch (e) {
      return next(e);
    }

    if (req.server._sub_owners.forEach(subOwner => subOwner._id === targetUser._id) !== undefined) { return next(new ActionFailed("User is already an subuser.", true)); }
    if (req.server._owner._id == targetUser._id) { return next(new ActionFailed("The server owner is not a valid subuser.", true)); }

    req.server._sub_owners.push(new Types.ObjectId(targetUser._id));
    try {
      await req.server.save();
    } catch (e) {
      return next(new ActionFailed("Failed save server.", false));
    }

    return res.json({});
  };

  public addServer = async (req, res, next) => {
    if (
      process.env.NODE_ENV !== "dev" &&
      Captcha.checkValid(req.connection.remoteAddress, req.body.captcha)
    ) {
      return next(
        new ValidationError({
          location: "body",
          param: "email",
          msg: "Captcha is incorrect"
        })
      );
    }

    let existingServers;
    let decidedNode;
    let preset;
    let nodes;
    let user;
    try {
      existingServers = await GameServerModel.find({
        $or: [
          {
            name: req.body.name
          },
          {
            "_owner": Types.ObjectId(req.payload.id)
          }
        ]
      });
    } catch (e) {
      return next(e);
    }

    if (existingServers.length !== 0) {
      if (existingServers[0].name.toString() === req.body.name.toString()) {
        return next(
          new ValidationError({
            location: "body",
            param: "name",
            msg: "Name already assigned"
          })
        );
      } else if (
        existingServers[0]._owner.toString() ===
        Types.ObjectId(req.payload.id).toString()
      ) {
        return next(new ActionFailed("You already own a server.", true));
      }
      return next(new ActionFailed("Value already exists", true));
    }

    try {
      const getUser = UserModel.findById(
        Types.ObjectId(req.payload.id)
      );
      const getPreset = PresetModel.findById(Types.ObjectId(req.body.preset)).orFail();
      const getNodes = ServerNodeModel.find({});

      user = await getUser;
      preset = await getPreset;
      nodes = await getNodes;
    } catch (e) {
      return next(e);
    }

    // Make sure the user is verified
    if (!user.checkVerified()) {
      return next(
        new ActionFailed("You must first verify your account.", true)
      );
    }

    // Check if the user has access to preset
    if (
      user._group._presetsAllowed.find(
        groupPreset => groupPreset._id.toString() === req.body.preset.toString()
      ) === undefined
    ) {
      console.log("debug:" + JSON.stringify(user._group._presetsAllowed[0]._id));
      console.log("preset: " + req.body.preset);
      // if (!(user._group._presetsAllowed.indexOf(req.body.preset) > -1)) {
      return next(new ActionFailed("You don't have permissions.", true));
    }

    // Check if there are no nodes
    if (nodes.length < 1) {
      return next(new ActionFailed("No available nodes", false));
    }

    // THIS IS THE CODE THAT GETS A RANDOMIZED NODE THAT HAS FREE DISK STORAGE ON IT
    // THIS IS JANKY AF SO HELP PLZ
    const shuffledNodes = nodes
      .map(a => [Math.random(), a])
      .sort((a, b) => a[0] - b[0])
      .map(a => a[1]);

    let found = false;

    shuffledNodes.map(nodeModal => {
      if (found) {
        return;
      }
      console.log("node json: " + JSON.stringify(nodeModal)); // TODO: remove
      console.log("preset game: " + preset.game); // TODO: remove
      if (
        nodeModal.games.find(game => game.name === preset.game) !== undefined
      ) {
        console.log("passed!"); // TODO: remove
        if (!nodeModal.status.freedisk || !nodeModal.status.totaldisk) {
          SimplyServersAPI.logger.info(
            "Node " + nodeModal._id + " is too new."
          );
        } else {
          if (nodeModal.status.freedisk / nodeModal.status.totaldisk < 0.9) {
            console.log("we're ok!");
            // At 80%
            decidedNode = nodeModal;
            found = true;
            console.log("found node yay: " + JSON.stringify(decidedNode));
          } else {
            SimplyServersAPI.logger.info(
              "Node " +
                nodeModal._id +
                " is stressed (" +
                nodeModal.status.freedisk / nodeModal.status.totaldisk +
                ")"
            );
          }
        }
      }
    });

    // Make sure node is not undefined.
    if (!found || !decidedNode) {
      return next(new ActionFailed("No available nodes for game", true));
    }

    // Generate SFTP new password.
    // This needs to be decently secure but it's not a huge deal.
    // TODO: unused
    const sftpPwd = Util.generateRandom();

    // Create the user
    const ServerModal = new GameServer().getModelForClass(GameServer);

    const newServer = new ServerModal({
      _owner: Types.ObjectId(req.payload.id),
      sub_owners: [],
      preset: req.body.preset,
      timeOnline: 0,
      online: false,
      nodeInstalled: decidedNode._id, // ITS BEEN INITIALIZED DUMBASS
      motd: req.body.motd,
      sftpPassword: sftpPwd,
      port: 0,
      name: req.body.name,
      _minecraftPlugins: []
    });

    try {
      await newServer.save();
    } catch (e) {
      return next(new ActionFailed("Failed save server.", false));
    }

    const serverTemplateConfig = {
      id: newServer._id,
      game: preset.game,
      port: -1,
      build: {
        io: preset.build.io,
        cpu: preset.build.cpu,
        mem: preset.build.mem
      },
      players: preset.maxPlayers
    };

    // Create manager config
    const nodeInterface = new NodeInterface(decidedNode);

    let createData;
    try {
      createData = await nodeInterface.add(
        JSON.stringify(serverTemplateConfig),
        sftpPwd
      );
    } catch (e) {
      try {
        await newServer.remove();
        return next(
          new ActionFailed("Failed to add server to selected node", false)
        );
      } catch (e) {
        return next(new ActionFailed("Failed recovering from fallback", false));
      }
    }

    // Update server port from data
    newServer.port = createData.server.port;

    try {
      await newServer.save();
    } catch (e) {
      return next(new ActionFailed("Failed updating server port", false));
    }

    // (if its a Minecraft server) update minecraft_properties
    if (preset.special.views.indexOf("minecraft_properties_viewer") > -1) {
      // Create the user
      const MinecraftPropertiesModal = new MinecraftProperties().getModelForClass(
        MinecraftProperties
      );

      const serverProperties = new MinecraftPropertiesModal({
        server: newServer._id,
        settings: {
          spawnprotection: 16,
          allownether: true,
          gamemode: 0,
          difficulty: 1,
          spawnmonsters: true,
          pvp: true,
          hardcore: false,
          allowflight: false,
          resourcepack: "",
          whitelist: false
        }
      });

      try {
        await serverProperties.save();
      } catch (e) {
        return next(new ActionFailed("Failed save server properties.", false));
      }
    }

    // Install any preinstalled plugins specified
    if (preset.preinstalledPlugins) {
      await Promise.all(
        preset.preinstalledPlugins.map(async value => {
          try {
            await nodeInterface.installPlugin(newServer._id, value);
          } catch (e) {
            SimplyServersAPI.logger.error("Server plugin install failed: " + e);
          }
        })
      );
    }

    return res.json({});
  };

  public changePreset = async (req, res, next) => {
    let user;
    let newPreset;

    try {
      const getUser = UserModel.findById(
        Types.ObjectId(req.payload.id)
      );
      const getNewPreset = PresetModel.findById(Types.ObjectId(req.body.preset)).orFail();

      user = await getUser;
      newPreset = await getNewPreset;
    } catch (e) {
      return next(e);
    }

    // Check to see if preset is compatible.
    if (!(req.server._preset.allowSwitchingTo.indexOf(req.body.preset) > -1)) {
      return next(new ActionFailed("Preset not allowed.", true));
    }

    if (!(user._group.presetsAllowed.indexOf(req.body.preset) > -1)) {
      return next(new ActionFailed("You don't have permissions.", true));
    }

    if (req.body.preset === req.server.preset) {
      return next(new ActionFailed("This is already your preset.", true));
    }

    // Contact node
    const nodeInterface = new NodeInterface(req.server._nodeInstalled);

    try {
      await nodeInterface.edit(
        req.server,
        JSON.stringify({
          build: {
            io: newPreset.build.io,
            mem: newPreset.build.mem,
            cpu: newPreset.build.cpu
          },
          players: newPreset.maxPlayers,
          game: newPreset.game
        })
      );
    } catch (e) {
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
      return next(new ActionFailed("Failed save server.", false));
    }

    return res.json({});
  };

  public removeServer = async (req, res, next) => {
    // Contact node
    const nodeInterface = new NodeInterface(req.server._nodeInstalled);

    try {
      await nodeInterface.remove(req.server);
    } catch (e) {
      switch (NodeInterface.niceHandle(e)) {
        case "SERVER_LOCKED":
          return next(new ActionFailed("Server is locked.", true));
        case "SERVER_NOT_OFF":
          return next(new ActionFailed("Server is not off", true));
        default:
          return next(new ActionFailed("Unknown error.", true));
      }
    }

    try {
      req.server.remove();
    } catch (e) {
      return next(new ActionFailed("Failed remove server.", false));
    }

    return res.json({});
  };
}
