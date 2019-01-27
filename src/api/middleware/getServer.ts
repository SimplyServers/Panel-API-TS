import { Storage } from "../../database/storage";
import { Models } from "../../types/models";
import { ActionFailed } from "../../util/errors/ActionFailed";

export class GetServerMiddleware {
  public static serverBasicAccess = async (req, res, next) => {
    console.log("gere");
    let server;
    try{
      server = await Storage.getItem(Models.GameServer, req.params.server);
    }catch (e) {
      return next(e);
    }

    if (server.owner === req.payload.id || server.sub_owners.indexOf(req.payload.id) > -1) {
      req.server = server; // Assign the server to a value in the request
      console.log("gere2");
      return next();
    } else {
      console.log("gere3");
      return next(new ActionFailed("You are not permitted to access this server.", true));
    }

  };

  public static serverOwnerAccess = async (req, res, next) => {
    let server;
    try{
      server = await Storage.getItem(Models.GameServer, req.params.server);
    }catch (e) {
      return next(e);
    }

    if (server.owner === req.payload.id) {
      req.server = server;
      return next();
    } else {
      return next(new ActionFailed("You are not permitted to access this server.", true));
    }
  };

  public static getServer = async (req, res, next) => {
    let server;
    try{
      server = await Storage.getItem(Models.GameServer, req.params.server);
    }catch (e) {
      return next(e);
    }
    req.server = server;
    return next();
  }
}