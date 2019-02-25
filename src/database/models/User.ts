import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { Types } from "mongoose";
import * as mongoose from "mongoose";
import { instanceMethod, pre, prop, Ref, Typegoose } from "typegoose";
import { SimplyServersAPI } from "../../SimplyServersAPI";
import Group, { GroupModel } from "./Group";

@pre<User>("save", async function(next) {
  if (this._id === undefined || this._id === null) {
    this._id = Types.ObjectId();
  }
  // if (this.game_info === undefined || this.game_info === null) {
  //   this.game_info = {
  //     minecraft: {},
  //     steam: {}
  //   };
  // }
  next();
})
export default class User extends Typegoose {
  @prop()
  public _id?: mongoose.Types.ObjectId;
  @prop()
  public game_info?: {
    minecraft?: {
      uuid?: string;
      username?: string;
      boughtPlugins?: string[];
    };
    steam?: {
      steamID?: string;
      username?: string;
    };
  };

  @prop({ ref: Group })
  public _group?: Ref<Group>;

  @prop()
  public account_info: {
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

  @prop()
  public balance: number;

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
    }else{
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
}

export const UserModel = new User().getModelForClass(User, {
  existingMongoose: mongoose,
  schemaOptions: { collection: "users" }
});
