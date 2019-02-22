import { UnauthorizedError } from "express-jwt";
import { SimplyServersAPI } from "../../SimplyServersAPI";

export class SimplecoreAuthMiddleware {
  public static checkToken = async (req, res, next) => {
    const {
      headers: { authorization }
    } = req;

    if (authorization && authorization.split(" ")[0] === "Token") {
      return authorization.split(" ")[1];
    }

    if (authorization !== SimplyServersAPI.config.simpleCoreSecret) {
      return next(
        new UnauthorizedError("invalid_token", {
          message: "Invalid SimpleCore Token"
        })
      );
    }

    return next();
  };
}
