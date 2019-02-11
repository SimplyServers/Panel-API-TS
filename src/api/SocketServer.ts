import socketClient = require("socket.io-client");
import * as socketJwt from "socketio-jwt";

import { Storage } from "../database/Storage";
import { SimplyServersAPI } from "../SimplyServersAPI";
import { Models } from "../types/Models";


export class SocketServer {

  private consoleSocket: any;
  private uploadSocket: any;
  private downloadSocket: any;

  constructor(io: any) {
      this.consoleSocket = io.of('/console');
      this.uploadSocket = io.of('/upload');
      this.downloadSocket = io.of('/download');
  }

  public bootstrap = (): void => {
    this.initConsole();
    this.initDownload();
    this.initUpload();
  };

  private initConsole = (): void => {
    // This throws a gay error because of typings. Ignore
    // @ts-ignore
    this.consoleSocket.on('connection', socketJwt.authorize({
      secret: SimplyServersAPI.config.web.JWTSecret,
      timeout: 15000
    })).on('authenticated', async (socket) => {

      if(!socket.handshake.query.server) {
        socket.disconnect();
        return;
      }

      let server;
      try {
        server = await Storage.getItem({
          model: Models.GameServer,
          id: Storage.mongoSterlize(socket.handshake.query.server)
        });
      }catch (e) {
        socket.disconnect();
        return;
      }

      if (server.owner !== socket.decoded_token.id && !(server.sub_owners.indexOf(socket.decoded_token.id) > -1)) {
        socket.disconnect();
        return;
      }

      let node;
      try{
        node = await Storage.getItem({
          model: Models.Node,
          id: server.nodeInstalled
        });
      }catch (e) {
        socket.disconnect();
        return;
      }

      // Make a stream to the node
      // Stupid typings error. Ignore
      // @ts-ignore
      const serverSocket = socketClient('https://' + node.ip + ":" + node.port + "/server/" + server._id, {
        path: "/s/",
        transports: ['websocket', 'flashsocket', 'polling'],
        rejectUnauthorized: false,
        query: {
          authentication: node.secret
        }
      });

      // Kill it on disconnect
      socket.on('disconnect', () => {
        if (serverSocket) {
          serverSocket.disconnect();
        }
      });

      serverSocket.on('console', (data) => {
        socket.emit('console', data);
      });

      serverSocket.on('block', (data) => {
        socket.emit('block', data);
      });

      serverSocket.on('installed', (data) => {
        socket.emit('installed', data);
      });

      serverSocket.on('announcement', (data) => {
        socket.emit('announcement', data);
      });

      serverSocket.on('statusUpdate', (data) => {
        socket.emit('statusUpdate', data);
      });

      serverSocket.on('initialStatus', (data) => {
        socket.emit('initialStatus', data);
      });

      // This hopefully will prevent a manager disconnect from duplicating all these events.
      serverSocket.on('disconnect', () => {
        socket.disconnect();
      });
    })
  };

  private initUpload = (): void => {

  };

  private initDownload = (): void => {

  }

}