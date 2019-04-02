import * as mongoose from "mongoose";
import { Types } from "mongoose";
import {
  arrayProp,
  instanceMethod,
  post,
  pre,
  prop, Ref,
  staticMethod,
  Typegoose
} from "typegoose";
import { SimplyServersAPI } from "../SimplyServersAPI";
import { Captcha, ICaptchaRequest } from "../util/Captcha";
import { ActionFailed } from "../util/errors/ActionFailed";
import { ValidationError } from "../util/errors/ValidationError";
import { NodeInterface } from "../util/NodeInterface";
import { Util } from "../util/Util";
import { ControlsHelper } from "./helpers/gameserver/ControlsHelper";
import { FilesystemHelper } from "./helpers/gameserver/FilesystemHelper";
import { PowerHelper } from "./helpers/gameserver/PowerHelper";
import MinecraftPluginSchema from "./MinecraftPluginSchema";
import MinecraftPropertiesSchema from "./MinecraftPropertiesSchema";
import PresetSchema, { PresetModel } from "./PresetSchema";
import ServerNodeSchema, { ServerNodeModel } from "./ServerNodeSchema";
import UserSchema, { UserModel } from "./UserSchema";

export interface ICreateServerOptions {
  owner: string;
  name: string;
  preset: string;
  motd: string;
}

@pre<GameServerSchema>("save", async function(next) {
  if (this._id === undefined || this._id === null) {
    this._id = Types.ObjectId();
  }
  next();
})
@post<GameServerSchema>("find", async docs => {
  for (const doc of docs) {
    await doc
      .populate("_sub_owners", "_id account_info.username")
      .execPopulate();
    await doc.populate("_preset").execPopulate();
    await doc.populate("_minecraftPlugins").execPopulate();
    await doc
      .populate(
        "_owner",
        "_id account_info.username _minecraftBoughtPlugins balance"
      )
      .execPopulate();
  }
})
@post<GameServerSchema>("findOne", async doc => {
  await doc.populate("_sub_owners", "_id account_info.username").execPopulate();
  await doc.populate("_preset").execPopulate();
  await doc.populate("_minecraftPlugins").execPopulate();
  await doc
    .populate(
      "_owner",
      "_id account_info.username _minecraftBoughtPlugins balance"
    )
    .execPopulate();
})
export default class GameServerSchema extends Typegoose {
  /* tslint:disable:variable-name */
  @prop() public _id?: Types.ObjectId;
  @prop({ ref: UserSchema }) public _owner: Ref<UserSchema>;
  @arrayProp({ itemsRef: UserSchema }) public _sub_owners?: Ref<UserSchema[]>;
  @prop({ ref: PresetSchema }) public _preset: Ref<PresetSchema>;
  @prop() public timeOnline: number;
  @prop() public motd: string;
  @prop({ ref: ServerNodeSchema }) public _nodeInstalled: Ref<ServerNodeSchema>;
  @prop() public sftpPassword: string;
  @prop() public online: boolean;
  @prop() public name: string;
  @prop() public port: number;
  @arrayProp({ itemsRef: MinecraftPluginSchema })
  public _minecraftPlugins?: Ref<MinecraftPluginSchema[]>;

  private controlsHelper: ControlsHelper = new ControlsHelper(this);
  private filesystemHelper: FilesystemHelper = new FilesystemHelper(this);
  private powerHelper: PowerHelper = new PowerHelper(this);

  @instanceMethod
  public getControlsHelper() {
    return this.controlsHelper;
  }

  @instanceMethod
  public getFilesystemHelper() {
    return this.filesystemHelper;
  }

  @instanceMethod
  public getPowerHelper() {
    return this.powerHelper;
  }

  @instanceMethod
  public async removeManager(){
    // Contact node
    const nodeInterface = new NodeInterface(
      this._nodeInstalled as ServerNodeSchema
    );

    try {
      await nodeInterface.remove(this);
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
  }

  @instanceMethod
  public async changePreset(presetId: string){
    let user;
    let newPreset;

    const getUser = UserModel.findById((this._owner as UserSchema)._id);
    const getNewPreset = PresetModel.findById(Types.ObjectId(presetId)).orFail();

    user = await getUser;
    newPreset = await getNewPreset;

    // Check to see if preset is compatible.
    if(((this._preset as PresetSchema)._allowSwitchingTo as PresetSchema[]).find(preset => preset._id.toHexString() === presetId) === undefined) {
      throw new ActionFailed("PresetSchema not allowed.", true);
    }

    if (!(user._group.presetsAllowed.indexOf(presetId) > -1)) {
      throw new ActionFailed("You don't have permissions.", true);
    }

    if (presetId === (this._preset as PresetSchema)._id.toString()) {
      throw new ActionFailed("This is already your preset.", true);
    }

    // Contact node
    const nodeInterface = new NodeInterface(
      this._nodeInstalled as ServerNodeSchema
    );

    try {
      await nodeInterface.edit(
        this,
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

    this._preset = Types.ObjectId(presetId);
  }

  @staticMethod
  public async addServer(options: ICreateServerOptions, captcha: ICaptchaRequest){
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
          name: options.name
        },
        {
          _owner: Types.ObjectId(options.owner)
        }
      ]
    });

    if (existingServers.length !== 0) {
      if (existingServers[0].name.toString() === options.name) {
        throw new ValidationError({
          location: "body",
          param: "name",
          msg: "Name already assigned"
        });
      } else if (
        existingServers[0]._owner.toString() ===
        Types.ObjectId(options.owner).toString()
      ) {
        throw new ActionFailed("You already own a server.", true);
      }
      throw new ActionFailed("Value already exists", true);
    }

    const getUser = UserModel.findById(Types.ObjectId(options.owner));
    const getPreset = PresetModel.findById(
      Types.ObjectId(options.preset)
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
        groupPreset => groupPreset._id.toString() === options.preset
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
      _owner: Types.ObjectId(options.owner),
      _sub_owners: [],
      _preset: options.preset,
      timeOnline: 0,
      online: false,
      _nodeInstalled: decidedNode._id,
      motd: options.motd,
      sftpPassword: sftpPwd,
      port: 0,
      name: options.name,
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
  }

  @instanceMethod
  public async addSubuser(targetEmail: string){
    const targetUser = await UserModel.findOne({
      "account_info.email": targetEmail
    });

    const ownerTest = this._sub_owners;
    if (ownerTest instanceof Array) {
      ownerTest.forEach(s => {
        console.log(s._id);
      })
    }

    const subOwners = this._sub_owners as any;

    if (
      subOwners.find(subOwner => subOwner._id === targetUser._id) !==
      undefined
    ) {
      throw new ActionFailed("UserSchema is already an subuser.", true);
    }
    if ((this._owner as UserSchema)._id === targetUser._id) {
      throw new ActionFailed("The server owner is not a valid subuser.", true);
    }

    subOwners.push(new Types.ObjectId(targetUser._id));
  }

  @instanceMethod
  public async removeSubuser(targetID: string) {
    const targetUser = await UserModel.findById(Types.ObjectId(targetID));

    (this._sub_owners as UserSchema[]).filter(
      subOwner => subOwner._id !== targetUser._id
    );
  }

  @instanceMethod
  public async removePlugin(plugin: string) {
    // Contact node
    const nodeInterface = new NodeInterface(this
      ._nodeInstalled as ServerNodeSchema);

    try {
      await nodeInterface.removePlugin(this, plugin);
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
  }

  @instanceMethod
  public async installPlugin(plugin: string) {
    // Contact node
    const nodeInterface = new NodeInterface(this
      ._nodeInstalled as ServerNodeSchema);

    try {
      await nodeInterface.installPlugin(this, plugin);
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
  }
}

export const GameServerModel = new GameServerSchema().getModelForClass(
  GameServerSchema,
  {
    existingMongoose: mongoose,
    schemaOptions: { collection: "gameservers" }
  }
);
