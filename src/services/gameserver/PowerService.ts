import { ActionFailed } from "../../util/errors/ActionFailed";
import { NodeInterface } from "../../util/NodeInterface";

export class PowerService {
  public static setPower = async (server: any, stringAction: string) => {
    // Contact node
    const nodeInterface = new NodeInterface(server._nodeInstalled);

    try {
      switch (stringAction) {
        case "on":
          await nodeInterface.powerOn(server);
          break;
        case "off":
          await nodeInterface.powerOff(server);
          break;
        case "kill":
          await nodeInterface.powerKill(server);
          break;
        default:
          break;
      }
    } catch (e) {
      switch (NodeInterface.niceHandle(e)) {
        case "SERVER_LOCKED":
          throw new ActionFailed("Server is locked.", true);
        case "SERVER_NOT_OFF":
          throw new ActionFailed("File not found.", true);
        case "REINSTALL":
          throw new ActionFailed("Reinstall your server.", true);
        case "SERVER_NOT_RUNNING":
          throw new ActionFailed("Server not running", true);
        case "SERVER_NOT_STOPPED":
          throw new ActionFailed("Server not stopped", true);
        default:
          throw new ActionFailed("Unknown error.", true);
      }
    }
  };
}
