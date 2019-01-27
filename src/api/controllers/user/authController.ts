import { Router } from "express";
import { check, validationResult } from "express-validator/check";

import * as mongoose from "mongoose";
import * as passport from "passport";
import * as zxcvbn from "zxcvbn";
import User from "../../../database/models/user";

import { Storage } from "../../../database/storage";
import { SimplyServersAPI } from "../../../ssapi";
import { Models } from "../../../types/models";
import { ActionFailed } from "../../../util/errors/ActionFailed";
import { ValidationError } from "../../../util/errors/ValidationError";
import { IController } from "../IController";

export class AuthController implements IController{

  public initRoutes(router: Router): void {
      router.post('/auth/login', [
        check('email').isLength({max: 50}),
        check('email').isEmail(),
        check('password').isLength({max: 50}),
      ], this.login);

    router.post('/auth/register', [
      check('email').isLength({max: 50}),
      check('email').isEmail(),
      check('password').isLength({max: 50}),
      check('username').isLength({max: 50})
    ], this.login);
  }

  public regiser = async (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      return next(new ValidationError(errors.array()));
    }

    const passwordResults = zxcvbn(req.body.password);
    if(passwordResults.score < 2){
      return next(new ValidationError({
        "location": "body",
        "param": "password",
        "msg": "Password not strong enough"
      }))
    }

    // Check for existing users
    let existingUsers;
    try{
      existingUsers = await Storage.getItems(Models.User,  {$or: [{"account_info.email": req.body.email}, {"account_info.username": req.body.username}]})
    }catch (e) {
      return next(e);
    }
    if (existingUsers.length !== 0) {
      if (existingUsers[0].account_info.username === req.body.username) {
        return next(new ValidationError({
          "location": "body",
          "param": "username",
          "msg": "Username is taken"
        }))
      } else if (existingUsers[0].account_info.email === req.body.email) {
        return next(new ValidationError({
          "location": "body",
          "param": "email",
          "msg": "Email is taken"
        }))
      }
      return next(new ActionFailed('Value already exists', true));
    }

    // Create the verify token
    const verifyToken = (0 | Math.random() * 9e6).toString(36); // Wow so secure!

    // Create the user
    const UserModal = new User().getModelForClass(User);

    const newUser = new UserModal({
      account_info: {
        email: req.body.email,
        username: req.body.username,
        accountVerify: {accountVerified: false, verifyKey: verifyToken}
      },
      balance: 0
    });

    if(SimplyServersAPI.config.defaultGroup && SimplyServersAPI.config.defaultGroup !== ""){
      newUser.account_info.group = SimplyServersAPI.config.defaultGroup;
    }

    await newUser.save();

  };

  public login = async (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      return next(new ValidationError(errors.array()));
    }
      let user;
      // TODO: make passport async
      // try{
      //   user = await passport.authenticate('local', {session: false})(req, res);
      // }catch (e) {
      //   return next(e);
      // }
      try{
        user = await new Promise((resolve, reject) => {
          passport.authenticate('local', {session: false}, (err, passportUser) => {
            if(err){
              return reject(err);
            }

            if(passportUser){
              return resolve(passportUser);
            }else{
              return reject(new ActionFailed('Failed to authenticate', true));
            }
          })(req, res);
        });
      }catch (e) {
        return next(e);
      }

      console.log("got user: " + JSON.stringify(user));

      if(!user){
        return next(new ActionFailed("Failed to authenticate", true))
      }

      return res.json({
        user: await user.getAuthJSON()
      })
  };
}
