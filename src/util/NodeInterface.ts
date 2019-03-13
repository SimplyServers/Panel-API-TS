import * as querystring from "querystring";
import * as request from "request-promise";
import GameServerSchema from "../schemas/GameServerSchema";
import ServerNodeSchema from "../schemas/ServerNodeSchema";
import urlJoin = require("url-join");

export class NodeInterface {
  public games = async () => {
    return (await this.get("game")).games;
  };
  public query = async () => {
    return await this.get("node");
  };
  public powerOn = async (server: GameServerSchema) => {
    const serverRoot = urlJoin("server", server._id.toString());

    return await this.get(urlJoin(serverRoot, "power/on"));
  };
  public powerOff = async (server: GameServerSchema) => {
    const serverRoot = urlJoin("server", server._id.toString());

    return await this.get(urlJoin(serverRoot, "power/off"));
  };
  public powerKill = async (server: GameServerSchema) => {
    const serverRoot = urlJoin("server", server._id.toString());

    return await this.get(urlJoin(serverRoot, "power/kill"));
  };
  public reinstall = async (server: GameServerSchema) => {
    const serverRoot = urlJoin("server", server._id.toString());

    return await this.get(urlJoin(serverRoot, "reinstall"));
  };
  public install = async (server: GameServerSchema) => {
    const serverRoot = urlJoin("server", server._id.toString());

    return await this.get(urlJoin(serverRoot, "install"));
  };
  public remove = async (server: GameServerSchema) => {
    const serverRoot = urlJoin("server", server._id.toString());

    return await this.get(urlJoin(serverRoot, "remove"));
  };
  public changePassword = async (server: GameServerSchema, password: string) => {
    const serverRoot = urlJoin("server", server._id.toString());

    return await this.post(urlJoin(serverRoot, "resetPassword"), {
      password
    });
  };
  public edit = async (server: GameServerSchema, config: any) => {
    const serverRoot = urlJoin("server", server._id.toString());

    return await this.post(urlJoin(serverRoot, "edit"), {
      config
    });
  };
  public installPlugin = async (server: GameServerSchema, plugin: string) => {
    const serverRoot = urlJoin("server", server._id.toString());

    return await this.post(urlJoin(serverRoot, "installPlugin"), {
      plugin
    });
  };
  public removePlugin = async (server: GameServerSchema, plugin: string) => {
    const serverRoot = urlJoin("server", server._id.toString());

    return await this.post(urlJoin(serverRoot, "removePlugin"), {
      plugin
    });
  };
  public getServerPlugins = async (server: GameServerSchema) => {
    const serverRoot = urlJoin("server", server._id.toString());

    return await this.get(urlJoin(serverRoot, "plugins"));
  };
  public getPlugins = async () => {
    return (await this.get("/plugin")).plugins;
  };
  public add = async (config: any, password: string) => {
    return await this.post("/server/add", { config, password });
  };
  public serverStatus = async (server: GameServerSchema) => {
    return await this.get(urlJoin("server", server._id.toString()));
  };
  public checkAllowed = async (server: GameServerSchema, path: string) => {
    const serverRoot = urlJoin("server", server._id.toString());

    return await this.post(urlJoin(serverRoot, "checkAllowed"), { path });
  };
  public fileContents = async (server: GameServerSchema, path: string) => {
    const serverRoot = urlJoin("server", server._id.toString());

    return await this.post(urlJoin(serverRoot, "fileContents"), { path });
  };
  public execute = async (server: GameServerSchema, command: string) => {
    const serverRoot = urlJoin("server", server._id.toString());

    return await this.post(urlJoin(serverRoot, "execute"), { command });
  };
  public getDir = async (server: GameServerSchema, path: string) => {
    const serverRoot = urlJoin("server", server._id.toString());

    return await this.post(urlJoin(serverRoot, "getDir"), { path });
  };
  public removeFolder = async (server: GameServerSchema, path: string) => {
    const serverRoot = urlJoin("server", server._id.toString());

    return await this.post(urlJoin(serverRoot, "removeFolder"), { path });
  };
  public removeFile = async (server: GameServerSchema, path: string) => {
    const serverRoot = urlJoin("server", server._id.toString());

    return await this.post(urlJoin(serverRoot, "removeFile"), { path });
  };
  public createFile = async (
    server: GameServerSchema,
    path: string,
    contents: string
  ) => {
    const serverRoot = urlJoin("server", server._id.toString());

    return await this.post(urlJoin(serverRoot, "writeFile"), {
      path,
      contents
    });
  };
  private readonly node: ServerNodeSchema;
  private get = async (urlExt: string) => {
    // Typings are weird... we can use a string as a url and its ok
    const res = await request(
      // @ts-ignore
      urlJoin("https://" + this.node.ip + ":" + this.node.port, urlExt),
      {
        // Merge the node IP with the url extension
        headers: {
          authorization: "Token " + this.node.secret
        },
        rejectUnauthorized: false,
        requestCert: false, // TODO: I don't think this does anything lol
        method: "GET"
      }
    );

    return JSON.parse(res);
  };
  private post = async (urlExt: string, body: any) => {
    const formData = querystring.stringify(body);

    const res = await request(
      // @ts-ignore
      urlJoin("https://" + this.node.ip + ":" + this.node.port, urlExt),
      {
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
      }
    );

    return JSON.parse(res);
  };

  constructor(node: ServerNodeSchema) {
    this.node = node;
  }

  public static niceHandle(e) {
    if (!e.error) {
      return "Unknown error.";
    }

    let msg;
    try {
      msg = JSON.parse(e.error).msg;
    } catch (e) {
      msg = "Unknown error.";
    }

    return msg;
  }
}
