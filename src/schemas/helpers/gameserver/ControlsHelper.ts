import { ActionFailed } from "../../../util/errors/ActionFailed";
import { NodeInterface } from "../../../util/NodeInterface";
import { Helper } from "./Helper";

export class ControlsHelper extends Helper{
  constructor(props) {
    super(props);
  }

  public executeCommand = async (command: string) => {
    const nodeInterface = new NodeInterface(this.parent);
    try {
      await nodeInterface.execute(this.parent, command);
    } catch (e) {
      switch (NodeInterface.niceHandle(e)) {
        case "SERVER_NOT_OFF":
          throw new ActionFailed("Server not off.", true);
        default:
          throw new ActionFailed("Unknown error.", true);
      }
    }
  };

  public install = async () => {
    const nodeInterface = new NodeInterface(this.parent._nodeInstalled);
    try {
      await nodeInterface.install(this.parent);
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

  public reinstall = async () => {
    const nodeInterface = new NodeInterface(this.parent._nodeInstalled);
    try {
      await nodeInterface.reinstall(this.parent);
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
