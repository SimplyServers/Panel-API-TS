import {SimplyServersAPI} from "../../ssapi";

import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import * as mongoose from "mongoose";

const Schema = mongoose.Schema;

export interface IUser extends mongoose.Document {
  game_info: {
    minecraft: {
      uuid: string,
      username: string,
      boughtPlugins: string[]
    },
    steam: {
      steamID: string,
      username: string
    }
  },
  account_info: {
    username: string,
    email: string,
    group: string,
    primaryName: string,
    password: {
      hash: string
    },
    resetPassword: {
      resetKey: string,
      resetExpire: Date
    },
    accountVerify: {
      accountVerified: boolean,
      verifyKey: string
    }
  },
  balance: number
}


const User = new Schema({
  game_info: {
    minecraft: {
      uuid: String,
      username: String,
      boughtPlugins: [String]
    },
    steam: {
      steamID: String,
      username: String
    }
  },
  account_info: {
    username: String,
    email: String,
    group: String,
    primaryName: String,
    password: {
      hash: String
    },
    resetPassword: {
      resetKey: String,
      resetExpire: Date
    },
    accountVerify: {
      accountVerified: Boolean,
      verifyKey: String
    }
  },
  balance: Number
});

User.methods.removeCredits = function(credits: number) {
  if (this.balance - credits < 0) {
      return false;
  }
  this.balance -= credits;
  return true;
};

User.methods.setPassword = async function(password: string) {
  const salt = await bcrypt.genSalt(10);
  this.account_info.password.hash = await bcrypt.hash(password, salt);
};

User.methods.validatePassword = async function(password: string) {
  return await bcrypt.compare(password, this.account_info.password.hash);
};

User.methods.generateJWT = function() {
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
};

export default User;
