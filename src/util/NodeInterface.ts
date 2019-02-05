import * as querystring from "querystring";
import * as request from "request-promise";
import urlJoin = require("url-join");
import GameServer from "../database/models/GameServer";
import ServerNode from "../database/models/ServerNode";

import { ActionFailed } from "./errors/ActionFailed";

export class NodeInterface {

  public static niceHandle(e){
    if(!e.error){
      return "Unknown error.";
    }

    let msg;
    try{
      msg = JSON.parse(e.error).msg;
    }catch (e) {
      msg = "Unknown error.";
    }

    return msg;
  }

  private readonly node: ServerNode;

  constructor(node: ServerNode) {
    this.node = node;
  }

  public games = async () => {
    return await this.get("game");
  };

  public query = async () => {
    return await this.get("node");
  };

  public powerOn = async (server: GameServer) => {
    const serverRoot = urlJoin("server", server._id.toString());

    return await this.get(urlJoin(serverRoot, "power/on"));
  };

  public powerOff = async (server: GameServer) => {
    const serverRoot = urlJoin("server", server._id.toString());

    return await this.get(urlJoin(serverRoot, "power/off"));
  };

  public powerKill = async (server: GameServer) => {
    const serverRoot = urlJoin("server", server._id.toString());

    return await this.get(urlJoin(serverRoot, "power/kill"));
  };

  public reinstall = async (server: GameServer) => {
    const serverRoot = urlJoin("server", server._id.toString());

    return await this.get(urlJoin(serverRoot, "reinstall"));
  };

  public install = async (server: GameServer) => {
    const serverRoot = urlJoin("server", server._id.toString());

    return await this.get(urlJoin(serverRoot, "install"));
  };

  public remove = async (server: GameServer) => {
    const serverRoot = urlJoin("server", server._id.toString());

    return await this.get(urlJoin(serverRoot, "remove"));
  };

  public changePassword = async (server: GameServer, password: string) => {
    const serverRoot = urlJoin("server", server._id.toString());

    return await this.post(urlJoin(serverRoot, "resetPassword"), {
      password
    });
  };

  public edit = async (server: GameServer, config: any) => {
    const serverRoot = urlJoin("server", server._id.toString());

    return await this.post(urlJoin(serverRoot, "edit"), {
      config
    });
  };

  public installPlugin = async (server: GameServer, plugin: string) => {
    const serverRoot = urlJoin("server", server._id.toString());

    return await this.post(urlJoin(serverRoot, "installPlugin"), {
      plugin
    });
  };

  public removePlugin = async (server: GameServer, plugin: string) => {
    const serverRoot = urlJoin("server", server._id.toString());

    return await this.post(urlJoin(serverRoot, "removePlugin"), {
      plugin
    });
  };

  public getServerPlugins = async (server: GameServer) => {
    const serverRoot = urlJoin("server", server._id.toString());

    return await this.get(urlJoin(serverRoot, "plugins"));
  };

  public getPlugins = async () => {
    return await this.get("/plugin");
  };

  public add = async (server: GameServer, config: any, password: string) => {
    return await this.post("/server/add", { config, password });
  };

  public serverStatus = async (server: GameServer) => {
    return await this.get(urlJoin("server", server._id.toString()));
  };

  public checkAllowed = async (server: GameServer, path: string) => {
    const serverRoot = urlJoin("server", server._id.toString());

    return await this.post(urlJoin(serverRoot, "checkAllowed"), { path });
  };

  public fileContents = async (server: GameServer, path: string) => {
    const serverRoot = urlJoin("server", server._id.toString());

    return await this.post(urlJoin(serverRoot, "fileContents"), { path });
  };

  public execute = async (server: GameServer, command: string) => {
    const serverRoot = urlJoin("server", server._id.toString());

    return await this.post(urlJoin(serverRoot, "execute"), { command });
  };

  public getDir = async (server: GameServer, path: string) => {
    const serverRoot = urlJoin("server", server._id.toString());

    return await this.post(urlJoin(serverRoot, "getDir"), { path });
  };

  public removeFolder = async (server: GameServer, path: string) => {
    const serverRoot = urlJoin("server", server._id.toString());

    return await this.post(urlJoin(serverRoot, "removeFolder"), { path });
  };

  public removeFile = async (server: GameServer, path: string) => {
    const serverRoot = urlJoin("server", server._id.toString());

    return await this.post(urlJoin(serverRoot, "removeFile"), { path });
  };

  public createFile = async (
    server: GameServer,
    path: string,
    contents: string
  ) => {
    const serverRoot = urlJoin("server", server._id.toString());

    return await this.post(urlJoin(serverRoot, "writeFile"), {
      path,
      contents
    });
  };

  private get = async (urlExt: string) => {
    // Typings are weird... we can use a string as a url and its ok
    // @ts-ignore
    const res = await request("https://" + urlJoin(this.node.ip, urlExt), {
      // Merge the node IP with the url extension
      headers: {
        authorization: "Token " + this.node.secret
      },
      rejectUnauthorized: false,
      requestCert: false, // TODO: I don't think this does anything lol
      method: "GET"
    });

    return JSON.parse(res);
  };

  private post = async (urlExt: string, body: any) => {
    const formData = querystring.stringify(body);

    // @ts-ignore
    const res = await request(urlJoin(this.node.ip, urlExt), {
      // Merge the node IP with the url extension
      headers: {
        authorization: "Token " + this.node.secret,
        "Content-Length": formData.length,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      rejectUnauthorized: false,
      requestCert: false, // TODO: I don't think this does anything lol
      method: "POST",
      body: formData
    });

    return JSON.parse(res);
  };
}
