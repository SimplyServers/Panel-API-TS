import { Types } from "mongoose";
import socketClient = require("socket.io-client");
import * as socketJwt from "socketio-jwt";
import { GameServerModel } from "../database/GameServer";

import { SimplyServersAPI } from "../SimplyServersAPI";
import { Validators } from "../util/Validators";

export class SocketServer {
  private consoleSocket: any;
  private uploadSocket: any;
  private downloadSocket: any;

  constructor(io: any) {
    this.consoleSocket = io.of("/console");
    this.uploadSocket = io.of("/upload");
    this.downloadSocket = io.of("/download");
  }

  public bootstrap = (): void => {
    this.initConsole();
    this.initDownload();
    this.initUpload();
  };

  private initConsole = (): void => {
    // This throws a gay error because of typings. Ignore
    // @ts-ignore
    this.consoleSocket
      .on(
        "connection",
        socketJwt.authorize({
          secret: SimplyServersAPI.config.web.JWTSecret,
          timeout: 15000
        })
      )
      .on("authenticated", async socket => {
        console.log("Client has authenticated")
        if (!socket.handshake.query.server) {
          console.log("Ehgre")
          socket.disconnect();
          return;
        }

        console.log("querydata: " + typeof socket.handshake.query.server.toString());
        console.log("qd: " + socket.handshake.query.server);

        let server;
        try {
          server = await GameServerModel.findById(new Types.ObjectId(socket.handshake.query.server)).populate("_nodeInstalled");
        } catch (e) {
          console.log(e);
          console.log("Ehgredadsdas")
          socket.disconnect();
          return;
        }

        console.log("oass 1");
        console.log("socket data: " + JSON.stringify(socket.decoded_token));
        console.log("api oid: " + server._owner._id.toString() + ", seocket: " + socket.decoded_token.id);
        console.log("fail check:" + (server._owner._id.toString() !== socket.decoded_token.id));
        console.log("1: " + typeof server._owner._id + " 2: " + typeof socket.decoded_token.id);
        if ((server._owner._id.toString() !== socket.decoded_token.id) &&
          (server._sub_owners.find(subOwner => subOwner._id.toString() === socket.decoded_token.id) === undefined)
        ) {
          console.log("bad")
          socket.disconnect();
          return;
        }

        console.log("oass 2");

        // Make a stream to the node
        // Stupid typings error. Ignore
        // @ts-ignore
        const serverSocket = socketClient(
          "https://" + server._nodeInstalled.ip + ":" + server._nodeInstalled.port + "/server/" + server._id,
          {
            path: "/s/",
            transports: ["websocket", "flashsocket", "polling"],
            rejectUnauthorized: false,
            query: {
              authentication: server._nodeInstalled.secret
            }
          }
        );

        console.log("oass 3");
        // Kill it on disconnect
        socket.on("disconnect", () => {
          if (serverSocket) {
            serverSocket.disconnect();
          }
        });

        serverSocket.on("console", data => {
          socket.emit("console", data);
        });

        serverSocket.on("block", data => {
          socket.emit("block", data);
        });

        serverSocket.on("installed", data => {
          socket.emit("installed", data);
        });

        serverSocket.on("announcement", data => {
          socket.emit("announcement", data);
        });

        serverSocket.on("statusUpdate", data => {
          socket.emit("statusUpdate", data);
        });

        serverSocket.on("initialStatus", data => {
          socket.emit("initialStatus", data);
        });

        // This hopefully will prevent a manager disconnect from duplicating all these events.
        serverSocket.on("disconnect", () => {
          socket.disconnect();
        });
      });
  };

  private initUpload = (): void => {};

  private initDownload = (): void => {};
}
