import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import * as mongoose from "mongoose";
import { Types } from "mongoose";
import { instanceMethod, post, pre, prop, Ref, Typegoose } from "typegoose";
import { SimplyServersAPI } from "../SimplyServersAPI";
import { GameServerModel } from "./GameServerSchema";
import GroupSchema, { GroupModel } from "./GroupSchema";
import MinecraftPluginSchema from "./MinecraftPluginSchema";
import PresetSchema from "./PresetSchema";

@pre<UserSchema>("save", async function(next) {
  if (this._id === undefined || this._id === null) {
    this._id = Types.ObjectId();
  }
  next();
})
@post<UserSchema>("find", async docs => {
  for (const doc of docs) {
    await doc.populate("_minecraftBoughtPlugins").execPopulate();
    await doc.populate("_group").execPopulate();
  }
})
@post<UserSchema>("findOne", async doc => {
  await doc.populate("_minecraftBoughtPlugins").execPopulate();
  await doc.populate("_group").execPopulate();
})
export default class UserSchema extends Typegoose {
  /* tslint:disable:variable-name */
  @prop() public _id?: mongoose.Types.ObjectId;
  @prop({ ref: MinecraftPluginSchema }) public _minecraftBoughtPlugins?: Array<
    Ref<MinecraftPluginSchema>
  >;
  @prop() public game_info?: {
    minecraft?: {
      uuid?: string;
      username?: string;
    };
    steam?: {
      steamID?: string;
      username?: string;
    };
  };
  @prop({ ref: GroupSchema }) public _group?: Ref<GroupSchema>;
  @prop() public account_info: {
    username: string;
    email: string;
    primaryName?: string;
    password: {
      hash?: string;
    };
    resetPassword: {
      resetKey?: string;
      resetExpire?: Date;
    };
    accountVerify: {
      accountVerified?: boolean;
      verifyKey?: string;
    };
  };
  @prop() public balance: number;

  @instanceMethod
  public removeCredits(credits: number) {
    if (this.balance - credits < 0) {
      return false;
    }
    this.balance -= credits;
    return true;
  }

  @instanceMethod
  public async setPassword(password: string) {
    const salt = await bcrypt.genSalt(10);
    this.account_info.password.hash = await bcrypt.hash(password, salt);
  }

  @instanceMethod
  public async getAuthJSON() {
    const returnData = {
      token: this.generateJWT(),
      email: this.account_info.email,
      username: this.account_info.username,
      id: this._id,
      credits: this.balance,
      mcUUID: "",
      group: undefined
    };

    if (
      this.game_info &&
      this.game_info.minecraft &&
      this.game_info.minecraft &&
      this.game_info.minecraft.uuid
    ) {
      returnData.mcUUID = this.game_info.minecraft.uuid;
    }

    if (this._group) {
      try {
        returnData.group = await GroupModel.findById(this._group);
      } catch (e) {
        // Ignore this safely
        returnData.group = "";
      }
    } else {
      returnData.group = "";
    }

    return returnData;
  }

  @instanceMethod
  public async validatePassword(password: string) {
    return await bcrypt.compare(password, this.account_info.password.hash);
  }

  @instanceMethod
  public checkVerified() {
    return this.account_info.accountVerify.accountVerified;
  }

  @instanceMethod
  public generateJWT() {
    const today = new Date();
    const expirationDate = new Date(today);
    expirationDate.setDate(today.getDate() + 7); // TODO: think about this...
    return jwt.sign(
      {
        email: this.account_info.email,
        username: this.account_info.username,
        id: this._id,
        exp: parseInt((expirationDate.getTime() / 1000).toString(), 10)
      },
      SimplyServersAPI.config.web.JWTSecret
    );
  }

  @instanceMethod
  public async getPresets(){
    return (this._group as GroupSchema)._presetsAllowed
  }

  @instanceMethod
  public async getServers() {
      const servers = await GameServerModel.find(
        {
          $or: [
            {
              _sub_owners: this._id
            },
            {
              _owner: this._id
            }
          ]
        },
        "-sftpPassword"
      );

    return servers.map(server => {
      (server._preset as PresetSchema).special.fs = undefined;
      return server;
    });
  }
}

export const UserModel = new UserSchema().getModelForClass(UserSchema, {
  existingMongoose: mongoose,
  schemaOptions: { collection: "users" }
});
