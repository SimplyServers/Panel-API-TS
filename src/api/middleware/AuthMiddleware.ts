import * as jwt from "express-jwt";
import { Types } from "mongoose";
import { UserModel } from "../../database/User";
import { SimplyServersAPI } from "../../SimplyServersAPI";
import { ActionFailed } from "../../util/errors/ActionFailed";

export class AuthMiddleware {
  public static isStaff = async (req, res, next) => {
    let user;
    try {
      user = await UserModel.findById(Types.ObjectId(req.payload.id));
    } catch (e) {
      return next(e);
    }
    if (!user._group) {
      return next(
        new ActionFailed(
          "You must be assigned to a group to access this endpoint",
          true
        )
      );
    }

    if (user._group.isAdmin || user._group.isStaff) {
      return next();
    } else {
      return next(new ActionFailed("You don't have permissions.", true));
    }
  };

  public static isAdmin = async (req, res, next) => {
    let user;
    try {
      user = await UserModel.findById(Types.ObjectId(req.payload.id));
    } catch (e) {
      return next(e);
    }


    if (!user._group) {
      return next(
        new ActionFailed(
          "You must be assigned to a group to access this endpoint",
          true
        )
      );
    }

    if (user._group.isAdmin) {
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
    return null;
  };

  private static getSecret = (req, payload, done) => {
    // This is here because typescript decided that it needed to compile some of this code instead of running it at runtime
    done(null, SimplyServersAPI.config.web.JWTSecret);
  };

  // We need this to be after the previous functions are defined. Blame Typescript and express-jwt.
  /* tslint:disable:member-ordering */
  /* tslint:disable:object-literal-sort-keys */
  public static jwtAuth = {
    required: jwt({
      secret: AuthMiddleware.getSecret,
      userProperty: "payload",
      getToken: AuthMiddleware.getToken
    }),
    optional: jwt({
      secret: AuthMiddleware.getSecret,
      userProperty: "payload",
      getToken: AuthMiddleware.getToken,
      credentialsRequired: false
    })
  };
  /* tslint:disable:member-ordering */
  /* tslint:disable:object-literal-sort-keys */
}
