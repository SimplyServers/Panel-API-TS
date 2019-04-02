import { ActionFailed } from "../../../util/errors/ActionFailed";
import { NodeInterface } from "../../../util/NodeInterface";
import { Helper } from "./Helper";

export class PowerHelper extends Helper{
  public setPower = async (stringAction: string) => {
    // Contact node
    const nodeInterface = new NodeInterface(this.parent._nodeInstalled);

    try {
      switch (stringAction) {
        case "on":
          await nodeInterface.powerOn(this.parent);
          break;
        case "off":
          await nodeInterface.powerOff(this.parent);
          break;
        case "kill":
          await nodeInterface.powerKill(this.parent);
          break;
        default:
          break;
      }
    } catch (e) {
      console.log(e);
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
