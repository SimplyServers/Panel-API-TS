import { ActionFailed } from "../../util/errors/ActionFailed";
import { NodeInterface } from "../../util/NodeInterface";

export class ControlsService {
  public static executeCommand = async (server: any, command: string) => {
    const nodeInterface = new NodeInterface(server._nodeInstalled);
    try {
      await nodeInterface.execute(server, command);
    } catch (e) {
      switch (NodeInterface.niceHandle(e)) {
        case "SERVER_NOT_OFF":
          throw new ActionFailed("Server not off.", true);
        default:
          throw new ActionFailed("Unknown error.", true);
      }
    }
  };

  public static install = async (server: any) => {
    const nodeInterface = new NodeInterface(server._nodeInstalled);
    try {
      await nodeInterface.install(server);
    } catch (e) {
      switch (NodeInterface.niceHandle(e)) {
        case "SERVER_LOCKED":
          throw new ActionFailed("Server is locked.", true);
        case "REINSTALL_INSTEAD":
          throw new ActionFailed("Reinstall your server instead.", true);
        case "SERVER_NOT_OFF":
          throw new ActionFailed("Server not off.", true);
        default:
          throw new ActionFailed("Unknown error.", true);
      }
    }
  };

  public static reinstall = async (server: any) => {
    const nodeInterface = new NodeInterface(server._nodeInstalled);
    try {
      await nodeInterface.reinstall(server);
    } catch (e) {
      switch (NodeInterface.niceHandle(e)) {
        case "SERVER_LOCKED":
          throw new ActionFailed("Server is locked.", true);
        case "INSTALL_INSTEAD":
          throw new ActionFailed("Install your server instead.", true);
        case "SERVER_NOT_OFF":
          throw new ActionFailed("Server not off.", true);
        default:
          throw new ActionFailed("Unknown error.", true);
      }
    }
  };
}
