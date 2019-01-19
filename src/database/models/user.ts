import {SimplyServersAPI} from "../../ssapi";

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const Schema = mongoose.Schema;

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

module.exports = mongoose.model("User", User);
