import { Types } from "mongoose";
import { GameServerModel } from "../../database/GameServer";
import { ActionFailed } from "../../util/errors/ActionFailed";

export class GetServerMiddleware {
  public static serverBasicAccess = async (req, res, next) => {
    let server;
    try {
      server = await GameServerModel.findById(Types.ObjectId(req.params.server))
        .populate("_nodeInstalled")
        .orFail();
    } catch (e) {
      return next(e);
    }

    if (
      server._owner._id.toString() === req.payload.id ||
      server._sub_owners.find(
        subOwner => subOwner._id.toString() === req.payload.id
      ) !== undefined
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
      server = await GameServerModel.findById(Types.ObjectId(req.params.server))
        .populate("_nodeInstalled")
        .orFail();
    } catch (e) {
      return next(e);
    }

    if (server._owner._id.toString() === req.payload.id) {
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
      server = await GameServerModel.findById(Types.ObjectId(req.params.server))
        .populate("_nodeInstalled")
        .orFail();
    } catch (e) {
      return next(e);
    }
    req.server = server;
    return next();
  };
}
