import { Types } from "mongoose";
import * as zxcvbn from "zxcvbn";
import { UserModel } from "../schemas/UserSchema";
import { SimplyServersAPI } from "../SimplyServersAPI";
import { ActionFailed } from "../util/errors/ActionFailed";
import { ValidationError } from "../util/errors/ValidationError";
import { Mailer } from "../util/Mailer";

export interface IRegister {
  username: string;
  password: string;
  email: string;
}

export class AuthService {
  public register = async (options: IRegister) => {
    const passwordResults = zxcvbn(options.password);

    if (passwordResults.score < 2) {
        throw new ValidationError({
          location: "body",
          param: "password",
          msg: "Password not strong enough"
        });
    }

    // Check for existing users
    const existingUsers = await UserModel.find({
      $or: [
        { "account_info.email": options.email },
        { "account_info.username": options.username }
      ]
    });

    if (existingUsers && existingUsers.length !== 0) {
      if (existingUsers[0].account_info.username === options.username) {
        throw new ValidationError({
            location: "body",
            param: "username",
            msg: "Username is taken"
          });
      } else if (existingUsers[0].account_info.email === options.email) {
        throw new ValidationError({
            location: "body",
            param: "email",
            msg: "Email is taken"
          });
      }
      throw new ActionFailed("Value already exists", true);
    }

    // Create the verify token
    const verifyToken = (0 | (Math.random() * 9e6)).toString(36); // Wow so secure!

    const newUser = new UserModel({
      game_info: {
        minecraft: {},
        steam: {}
      },
      account_info: {
        email: options.email,
        username: options.username,
        accountVerify: { accountVerified: false, verifyKey: verifyToken },
        password: {},
        resetPassword: {}
      },
      balance: 0
    });

    if (
      SimplyServersAPI.config.defaultGroup &&
      SimplyServersAPI.config.defaultGroup !== ""
    ) {
      newUser._group = Types.ObjectId(SimplyServersAPI.config.defaultGroup);
    }

    // TODO: GMAIL ARE DUMB
    // // Send them the verify email
    const mailer = new Mailer();
    // try{
    //   await mailer.sendVerify(newUser.account_info.email, verifyToken)
    // }catch (e) {
    //   SimplyServersAPI.logger.error(e);
    //   return next(new ValidationError({
    //     "location": "body",
    //     "param": "email",
    //     "msg": "Email is invalid"
    //   }))
    // }

    // Update password
    await newUser.setPassword(options.password);

    try {
      await newUser.save();
    } catch (e) {
      throw new ActionFailed("Failed to save user", false);
    }

    return  await newUser.getAuthJSON();
  };
}
