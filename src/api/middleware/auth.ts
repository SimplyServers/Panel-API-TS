import * as jwt from "express-jwt";
import { Storage } from "../../database/storage";
import { SimplyServersAPI } from "../../ssapi";
import { Models } from "../../types/models";
import { ActionFailed } from "../../util/errors/ActionFailed";

export class AuthMiddleware {
  public static isStaff = async (req, res, next) => {
    let user;
    let group;
    try {
      user = await Storage.getItem(Models.User, req.payload.id);
      if (!user.account_info.group || user.account_info.group === "") {
        return next(
          new ActionFailed(
            "You must be assigned to a group to access this endpoint",
            true
          )
        );
      }
      group = await Storage.getItem(Models.Group, user.account_info.group);
    } catch (e) {
      return next(e);
    }

    if (group.isAdmin || group.isStaff) {
      return next();
    } else {
      return next(new ActionFailed("You don't have permissions.", true));
    }
  };

  public static isAdmin = async (req, res, next) => {
    let user;
    let group;
    try {
      user = await Storage.getItem(Models.User, req.payload.id);
      if (!user.account_info.group || user.account_info.group === "") {
        return next(
          new ActionFailed(
            "You must be assigned to a group to access this endpoint",
            true
          )
        );
      }
      group = await Storage.getItem(Models.Group, user.account_info.group);
    } catch (e) {
      return next(e);
    }

    if (group.isAdmin) {
      return next();
    } else {
      return next(new ActionFailed("You don't have permissions.", true));
    }
  };

  private static getToken = (req: any) => {
    const {
      headers: { authorization }
    } = req;
    if (authorization && authorization.split(" ")[0] === "Token") {
      return authorization.split(" ")[1];
    }
    console.log("fucking hell");
    return null;
  };

  private static getSecret = () => {
    console.log("got secert");
    return SimplyServersAPI.config.web.JWTSecret;
  };

  public static jwtAuth = {
    required: jwt({
      secret: AuthMiddleware.getSecret,
      userProperty: "payload",
      getToken: AuthMiddleware.getToken
    }),
    optional: jwt({
      secret: AuthMiddleware.getSecret,
      userProperty: 'payload',
      getToken: AuthMiddleware.getToken,
      credentialsRequired: false,
    })
  };
}
