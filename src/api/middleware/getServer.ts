import { Storage } from "../../database/storage";
import { Models } from "../../types/models";
import { ActionFailed } from "../../util/errors/ActionFailed";

export class GetServerMiddleware {
  public serverBasicAccess = async (req, res, next) => {
    let server;
    try{
      server = await Storage.getItem(Models.Server, req.params.server);
    }catch (e) {
      return next(e);
    }

    if (server.owner === req.payload.id || server.sub_owners.indexOf(req.payload.id) > -1) {
      req.server = server; // Assign the server to a value in the request
      return next();
    } else {
      return next(new ActionFailed("You are not permitted to access this server.", true));
    }

  };

  public serverOwnerAccess = async (req, res, next) => {
    let server;
    try{
      server = await Storage.getItem(Models.Server, req.params.server);
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

  public getServer = async (req, res, next) => {
    let server;
    try{
      server = await Storage.getItem(Models.Server, req.params.server);
    }catch (e) {
      return next(e);
    }
    req.server = server;
    return next();
  }
}
