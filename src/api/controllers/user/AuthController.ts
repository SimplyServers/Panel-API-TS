import { Router } from "express";
import { check, validationResult } from "express-validator/check";
import { Types } from "mongoose";
import * as passport from "passport";
import * as zxcvbn from "zxcvbn";
import User from "../../../database/models/User";

import { SimplyServersAPI } from "../../../SimplyServersAPI";
import { ActionFailed } from "../../../util/errors/ActionFailed";
import { ValidationError } from "../../../util/errors/ValidationError";
import { Mailer } from "../../../util/Mailer";
import { IController } from "../IController";

export class AuthController implements IController {
  public initRoutes(router: Router): void {
    router.post(
      "/auth/login",
      [
        check("email").exists(),
        check("email").isLength({ max: 50 }),
        check("email").isEmail(),
        check("password").exists(),
        check("password").isLength({ max: 50 }),
        check("password").isString()
      ],
      this.login
    );

    router.post(
      "/auth/register",
      [
        check("email").exists(),
        check("email").isLength({ max: 50 }),
        check("email").isEmail(),
        check("email").normalizeEmail(),
        check("password").exists(),
        check("password").isLength({ max: 50 }),
        check("username").exists(),
        check("username").isLength({ max: 50 }),
        check("password").isString(),
        check("username").isString()
      ],
      this.register
    );
  }

  public register = async (req, res, next) => {
    const errors = validationResult(req);
    console.log("body: " + JSON.stringify(req.body.username));
    console.log("errors caught:" + JSON.stringify(errors.array()));
    if (!errors.isEmpty()) {
      return next(new ValidationError(errors.array()));
    }

    const passwordResults = zxcvbn(req.body.password);
    if (passwordResults.score < 2) {
      return next(
        new ValidationError({
          location: "body",
          param: "password",
          msg: "Password not strong enough"
        })
      );
    }

    // Check for existing users
    let existingUsers;
    try {
      // existingUsers = await Storage.getItems(Models.User, { $or: [{ "account_info.email": req.body.email }, { "account_info.username": req.body.username }] });
      existingUsers = await Storage.getItems({
        model: Models.User,
        condition: {
          $or: [
            { "account_info.email": req.body.email },
            { "account_info.username": req.body.username }
          ]
        }
      });
    } catch (e) {
      return next(e);
    }
    if (existingUsers.length !== 0) {
      if (existingUsers[0].account_info.username === req.body.username) {
        return next(
          new ValidationError({
            location: "body",
            param: "username",
            msg: "Username is taken"
          })
        );
      } else if (existingUsers[0].account_info.email === req.body.email) {
        return next(
          new ValidationError({
            location: "body",
            param: "email",
            msg: "Email is taken"
          })
        );
      }
      return next(new ActionFailed("Value already exists", true));
    }

    // Create the verify token
    const verifyToken = (0 | (Math.random() * 9e6)).toString(36); // Wow so secure!

    // Create the user
    const UserModal = new User().getModelForClass(User);

    const newUser = new UserModal({
      game_info: {
        minecraft: {},
        steam: {}
      },
      account_info: {
        email: req.body.email,
        username: req.body.username,
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
    await newUser.setPassword(req.body.password);

    try {
      await newUser.save();
    } catch (e) {
      return next(new ActionFailed("Failed to save user", false));
    }

    let userData;
    try {
      userData = await newUser.getAuthJSON();
    } catch (e) {
      return next(new ActionFailed("Failed to get auth info", false));
    }

    return res.json({
      user: userData
    });
  };

  public login = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationError(errors.array()));
    }

    console.log("wtf");
    let user;
    // TODO: make passport async
    // try{
    //   user = await passport.authenticate('local', {session: false})(req, res);
    // }catch (e) {
    //   return next(e);
    // }
    try {
      user = await new Promise((resolve, reject) => {
        passport.authenticate(
          "local",
          { session: false },
          (err, passportUser) => {
            if (err) {
              return reject(err);
            }

            if (passportUser) {
              return resolve(passportUser);
            } else {
              return reject(new ActionFailed("Failed to authenticate", true));
            }
          }
        )(req, res);
      });
    } catch (e) {
      return next(e);
    }

    if (!user) {
      return next(new ActionFailed("Failed to authenticate", true));
    }

    console.log("end of login... getting json!");

    try {
      console.log("got json! " + await user.getAuthJSON());
      return res.json({
        user: await user.getAuthJSON()
      });
    } catch (e) {
      return next(e);
    }
  };
}
