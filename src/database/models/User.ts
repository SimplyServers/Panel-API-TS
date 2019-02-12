import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { instanceMethod, pre, prop, Typegoose } from "typegoose";
import { SimplyServersAPI } from "../../SimplyServersAPI";
import { Models } from "../../types/Models";
import { Storage } from "../Storage";

@pre<User>("save", async function(next) {
  if (this._id === undefined || this._id === null) {
    this._id = Types.ObjectId();
  }
  next();
})
export default class User extends Typegoose {
  @prop()
  /* tslint:disable:variable-name */
  public _id?: Types.ObjectId;
  @prop()
  public game_info: {
    minecraft: {
      uuid?: string;
      username?: string;
      boughtPlugins?: string[];
    };
    steam: {
      steamID?: string;
      username?: string;
    };
  };

  @prop()
  public account_info: {
    username: string;
    email: string;
    group?: string;
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
      mcUUID: this.game_info.minecraft.uuid,
      id: this._id,
      credits: this.balance,
      group: ""
    };

    if (this.account_info.group && this.account_info.group !== "") {
      returnData.group = await Storage.getItem({
        model: Models.Group,
        id: this.account_info.group
      });
    }

    return returnData;
  }

  @instanceMethod
  public async validatePassword(password: string) {
    return await bcrypt.compare(password, this.account_info.password.hash);
  }

  @instanceMethod
  public checkVerified(){
    return this.account_info.accountVerify.accountVerified
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
