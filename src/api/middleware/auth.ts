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
        return next(new ActionFailed("You must be assigned to a group to access this endpoint", true));
      }
      group = await Storage.getItem(Models.Group, user.account_info.group);
    }catch (e) {
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
        return next(new ActionFailed("You must be assigned to a group to access this endpoint", true));
      }
      group = await Storage.getItem(Models.Group, user.account_info.group);
    }catch (e) {
      return next(e);
    }

    if (group.isAdmin) {
      return next();
    } else {
      return next(new ActionFailed("You don't have permissions.", true));
    }
  };

  public static required = () => {
    return jwt({
      secret: SimplyServersAPI.config.web.JWTSecret,
      userProperty: 'payload',
      getToken: AuthMiddleware.getToken,
    });
  };

  private static getToken = (req: any) => {
    const {headers: {authorization}} = req;
    if (authorization && authorization.split(' ')[0] === 'Token') {
      return authorization.split(' ')[1];
    }
    return null;
  };
}
