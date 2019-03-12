import { Types } from "mongoose";
import  { GameServerModel } from "../../schemas/GameServerSchema";
import MinecraftPropertiesSchema from "../../schemas/MinecraftPropertiesSchema";
import { PresetModel } from "../../schemas/PresetSchema";
import ServerNodeSchema, {
  ServerNodeModel
} from "../../schemas/ServerNodeSchema";
import { UserModel } from "../../schemas/UserSchema";
import { SimplyServersAPI } from "../../SimplyServersAPI";
import { Captcha, ICaptchaRequest } from "../../util/Captcha";
import { ActionFailed } from "../../util/errors/ActionFailed";
import { ValidationError } from "../../util/errors/ValidationError";
import { NodeInterface } from "../../util/NodeInterface";
import { Util } from "../../util/Util";

export interface ICreateServer {
  owner: string;
  name: string;
  preset: string;
  motd: string;
}

export class GameServerService {
  public installPlugin = async (server: any, plugin: string) => {
    // Contact node
    const nodeInterface = new NodeInterface(
      server._nodeInstalled as ServerNodeSchema
    );

    try {
      await nodeInterface.installPlugin(server, plugin);
    } catch (e) {
      switch (NodeInterface.niceHandle(e)) {
        case "PLUGIN_INSTALLED":
          throw new ActionFailed("Plugin already installed.", true);
        case "INVALID_PLUGIN":
          throw new ActionFailed("Plugin does not exist.", true);
        case "PLUGIN_NOT_SUPPORTED":
          throw new ActionFailed("Plugin not supported.", true);
        case "SERVER_NOT_OFF":
          throw new ActionFailed("Server is not off.", true);
        case "SERVER_LOCKED":
          throw new ActionFailed("Server is locked.", true);
        default:
          throw new ActionFailed("Unknown error.", true);
      }
    }
  };

  public removePlugin = async (server: any, plugin: string) => {
    // Contact node
    const nodeInterface = new NodeInterface(
      server._nodeInstalled as ServerNodeSchema
    );

    try {
      await nodeInterface.removePlugin(server, plugin);
    } catch (e) {
      switch (NodeInterface.niceHandle(e)) {
        case "PLUGIN_NOT_INSTALLED":
          throw new ActionFailed("Plugin is not installed.", true);
        case "SERVER_NOT_OFF":
          throw new ActionFailed("Server is not off.", true);
        case "SERVER_LOCKED":
          throw new ActionFailed("Server is locked.", true);
        default:
          throw new ActionFailed("Unknown error.", true);
      }
    }
  };

  public removeSubuser = async (server: any, targetID: string) => {
    const targetUser = await UserModel.findById(Types.ObjectId(targetID));

    server._sub_owners.filter(subOwner => subOwner._id !== targetUser._id);
    await server.save();
  };

  public addSubuser = async (server: any, email: string) => {
    let targetUser;
    targetUser = await UserModel.findOne({
      "account_info.email": email
    });

    if (
      // @ts-ignore
      server._sub_owners.find(subOwner => subOwner._id === targetUser._id) !==
      undefined
    ) {
      throw new ActionFailed("UserSchema is already an subuser.", true);
    }
    if (server._owner._id === targetUser._id) {
      throw new ActionFailed("The server owner is not a valid subuser.", true);
    }

    server._sub_owners.push(new Types.ObjectId(targetUser._id));
    await server.save();
  };

  public addServer = async (
    settings: ICreateServer,
    captcha?: ICaptchaRequest
  ) => {
    if (
      captcha &&
      process.env.NODE_ENV !== "dev" &&
      !Captcha.checkValid(captcha)
    ) {
      throw new ValidationError({
        location: "body",
        param: "email",
        msg: "Captcha is incorrect"
      });
    }

    let existingServers;
    let preset;
    let nodes;
    let user;
    existingServers = await GameServerModel.find({
      $or: [
        {
          name: settings.name
        },
        {
          _owner: Types.ObjectId(settings.owner)
        }
      ]
    });

    if (existingServers.length !== 0) {
      if (existingServers[0].name.toString() === settings.name) {
        throw new ValidationError({
          location: "body",
          param: "name",
          msg: "Name already assigned"
        });
      } else if (
        existingServers[0]._owner.toString() ===
        Types.ObjectId(settings.owner).toString()
      ) {
        throw new ActionFailed("You already own a server.", true);
      }
      throw new ActionFailed("Value already exists", true);
    }

    const getUser = UserModel.findById(Types.ObjectId(settings.owner));
    const getPreset = PresetModel.findById(
      Types.ObjectId(settings.preset)
    ).orFail();
    const getNodes = ServerNodeModel.find({});

    user = await getUser;
    preset = await getPreset;
    nodes = await getNodes;

    // Make sure the user is verified
    if (!user.checkVerified()) {
      throw new ActionFailed("You must first verify your account.", true);
    }

    // Check if the user has access to preset
    if (
      user._group._presetsAllowed.find(
        groupPreset => groupPreset._id.toString() === settings.preset
      ) === undefined
    ) {
      throw new ActionFailed("You don't have permissions.", true);
    }

    // Check if there are no nodes
    if (nodes.length < 1) {
      throw new ActionFailed("No available nodes", false);
    }

    const shuffledNodes = nodes
      .map(a => [Math.random(), a])
      .sort((a, b) => a[0] - b[0])
      .map(a => a[1]);
    const contenders = shuffledNodes.filter(
      shuffledNode =>
        shuffledNode.games.find(game => game.name === preset.game) !== undefined
    );

    if (!contenders) {
      throw new ActionFailed("No available nodes that are contenders", true);
    }

    const decidedNode = contenders.find(
      contender =>
        contender.status.freedisk &&
        contender.status.totaldisk &&
        contender.status.freedisk / contender.status.totaldisk < 0.9
    );

    // Make sure node is not undefined.
    if (!decidedNode) {
      throw new ActionFailed("All nodes are at capacity.", true);
    }

    // Generate SFTP new password.
    // This needs to be decently secure but it's not a huge deal.
    // TODO: unused
    const sftpPwd = Util.generateRandom();

    const newServer = new GameServerModel({
      _owner: Types.ObjectId(settings.owner),
      _sub_owners: [],
      _preset: settings.preset,
      timeOnline: 0,
      online: false,
      _nodeInstalled: decidedNode._id,
      motd: settings.motd,
      sftpPassword: sftpPwd,
      port: 0,
      name: settings.name,
      _minecraftPlugins: []
    });

    await newServer.save();

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
      await newServer.remove();
      throw new ActionFailed("Failed to add server to selected node", false);
    }

    // Update server port from data
    newServer.port = createData.server.port;

    await newServer.save();

    // (if its a Minecraft server) update minecraft_properties
    if (preset.special.views.indexOf("minecraft_properties_viewer") > -1) {
      // Create the user
      const MinecraftPropertiesModal = new MinecraftPropertiesSchema().getModelForClass(
        MinecraftPropertiesSchema
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
        throw new ActionFailed("Failed save server properties.", false);
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
  };

  public changePreset = async (server: any, presetId: string) => {
    let user;
    let newPreset;

    const getUser = UserModel.findById(server._owner._id);
    const getNewPreset = PresetModel.findById(Types.ObjectId(presetId)).orFail();

    user = await getUser;
    newPreset = await getNewPreset;

    // Check to see if preset is compatible.
    if (!(server._preset.allowSwitchingTo.indexOf(presetId) > -1)) {
      throw new ActionFailed("PresetSchema not allowed.", true);
    }

    if (!(user._group.presetsAllowed.indexOf(presetId) > -1)) {
      throw new ActionFailed("You don't have permissions.", true);
    }

    if (presetId === server._preset._id.toString()) {
      throw new ActionFailed("This is already your preset.", true);
    }

    // Contact node
    const nodeInterface = new NodeInterface(
      server._nodeInstalled as ServerNodeSchema
    );

    try {
      await nodeInterface.edit(
        server,
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
          throw new ActionFailed("Server is locked.", true);
        case "SERVER_NOT_OFF":
          throw new ActionFailed("Server is not off", true);
        default:
          throw new ActionFailed("Unknown error.", true);
      }
    }

    server.preset = presetId;
    await server.save();
  };

  public removeServer = async (server: any) => {
    // Contact node
    const nodeInterface = new NodeInterface(
      server._nodeInstalled as ServerNodeSchema
    );

    try {
      await nodeInterface.remove(server);
    } catch (e) {
      switch (NodeInterface.niceHandle(e)) {
        case "SERVER_LOCKED":
          throw new ActionFailed("Server is locked.", true);
        case "SERVER_NOT_OFF":
          throw new ActionFailed("Server is not off", true);
        default:
          throw new ActionFailed("Unknown error.", true);
      }
    }

    server.remove();
  };
}
