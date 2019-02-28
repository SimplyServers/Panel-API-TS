import { Types } from "mongoose";
import { GameServerModel } from "../../database/GameServer";
import { ActionFailed } from "../../util/errors/ActionFailed";

export class GetServerMiddleware {
  public static serverBasicAccess = async (req, res, next) => {
    let server;
    try {
      server = await GameServerModel.findById(req.params.server);
      console.log("populated server: " + JSON.stringify(server));
    } catch (e) {
      return next(e);
    }

    if (
      server.owner === Types.ObjectId(req.payload.id) ||
      server.sub_owners.indexOf(Types.ObjectId(req.payload.id)) > -1
    ) {
      req.server = server; // Assign the server to a value in the request
      return next();
    } else {
      return next(
        new ActionFailed("You are not permitted to access this server.", true)
      );
    }
  };

  public static serverOwnerAccess = async (req, res, next) => {
    let server;
    try {
      server = await GameServerModel.findById(req.params.server);
      console.log("populated server: " + JSON.stringify(server));
    } catch (e) {
      return next(e);
    }

    if (server.owner === Types.ObjectId(req.payload.id)) {
      req.server = server;
      return next();
    } else {
      return next(
        new ActionFailed("You are not permitted to access this server.", true)
      );
    }
  };

  public static getServer = async (req, res, next) => {
    let server;
    try {
      server = await GameServerModel.findById(req.params.server);
      console.log("populated server: " + JSON.stringify(server));
    } catch (e) {
      return next(e);
    }
    req.server = server;
    return next();
  };
}
