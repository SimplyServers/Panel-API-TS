import * as path from "path";
import PresetSchema from "../../schemas/PresetSchema";
import { ActionFailed } from "../../util/errors/ActionFailed";
import { NodeInterface } from "../../util/NodeInterface";

export class FilesystemService {
  public static checkViolations = (filePath: string, preset: PresetSchema) => {
    // The path should always start with a /
    if (!filePath.startsWith("/")) {
      filePath = "/" + filePath;
    }

    // The path should never end with a /
    if (filePath.endsWith("/")) {
      filePath = filePath.slice(0, -1);
    }

    // Check to ensure we're not violating any fs rules
    return preset.special.fs.find(rule => rule.path === filePath) === undefined;
  };

  public static checkPath = async (
    server: any,
    filePath: string
  ): Promise<boolean> => {
    const nPath = path.normalize(filePath);

    // This removes the tailing/leading slash if its present
    // TODO: double check all conditions
    if (!FilesystemService.checkViolations(nPath, server._preset)) {
      throw new ActionFailed("Restricted file target.", false);
    }

    // Contact node
    const nodeInterface = new NodeInterface(server._nodeInstalled);

    let data;
    try {
      data = await nodeInterface.checkAllowed(server, nPath);
    } catch (e) {
      switch (NodeInterface.niceHandle(e)) {
        case "SERVER_LOCKED":
          throw new ActionFailed("Server is locked.", true);
        case "FILE_NOT_FOUND":
          throw new ActionFailed("File not found.", true);
        default:
          throw new ActionFailed("Unknown error.", true);
      }
    }
    return data.allowed;
  };

  public static writeFile = async (
    server: any,
    filePath: string,
    contents: string
  ) => {
    const nPath = path.normalize(filePath);

    // This removes the tailing/leading slash if its present
    // TODO: double check all conditions
    if (!FilesystemService.checkViolations(nPath, server._preset)) {
      throw new ActionFailed("Restricted file target.", false);
    }

    // Contact node
    const nodeInterface = new NodeInterface(server._nodeInstalled);

    try {
      await nodeInterface.createFile(server, filePath, contents);
    } catch (e) {
      switch (NodeInterface.niceHandle(e)) {
        case "SERVER_LOCKED":
          throw new ActionFailed("Server is locked.", true);
        case "FILE_NOT_FOUND":
          throw new ActionFailed("File not found.", true);
        default:
          throw new ActionFailed("Unknown error.", true);
      }
    }
  };

  public static removeFile = async (server: any, filePath: string) => {
    const nPath = path.normalize(filePath);

    // This removes the tailing/leading slash if its present
    // TODO: double check all conditions
    if (!FilesystemService.checkViolations(nPath, server._preset)) {
      throw new ActionFailed("Restricted file target.", false);
    }

    // Contact node
    const nodeInterface = new NodeInterface(server._nodeInstalled);

    try {
      await nodeInterface.removeFile(server, filePath);
    } catch (e) {
      switch (NodeInterface.niceHandle(e)) {
        case "SERVER_LOCKED":
          throw new ActionFailed("Server is locked.", true);
        case "FILE_NOT_FOUND":
          throw new ActionFailed("File not found.", true);
        default:
          throw new ActionFailed("Unknown error.", true);
      }
    }
  };

  public static removeFolder = async (server: any, filePath: string) => {
    const nPath = path.normalize(filePath);

    // This removes the tailing/leading slash if its present
    // TODO: double check all conditions
    if (!FilesystemService.checkViolations(nPath, server._preset)) {
      throw new ActionFailed("Restricted file target.", false);
    }

    // Contact node
    const nodeInterface = new NodeInterface(server._nodeInstalled);

    try {
      await nodeInterface.removeFolder(server, filePath);
    } catch (e) {
      switch (NodeInterface.niceHandle(e)) {
        case "SERVER_LOCKED":
          throw new ActionFailed("Server is locked.", true);
        case "FILE_NOT_FOUND":
          throw new ActionFailed("File not found.", true);
        default:
          throw new ActionFailed("Unknown error.", true);
      }
    }
  };

  public static fileContents = async (
    server: any,
    filePath: string
  ): Promise<string> => {
    const nPath = path.normalize(filePath);

    // This removes the tailing/leading slash if its present
    // TODO: double check all conditions
    if (!FilesystemService.checkViolations(nPath, server._preset)) {
      throw new ActionFailed("Restricted file target.", false);
    }

    // Contact node
    const nodeInterface = new NodeInterface(server._nodeInstalled);

    let data;
    try {
      data = await nodeInterface.fileContents(server, filePath);
    } catch (e) {
      switch (NodeInterface.niceHandle(e)) {
        case "SERVER_LOCKED":
          throw new ActionFailed("Server is locked.", true);
        case "FILE_NOT_FOUND":
          throw new ActionFailed("File not found.", true);
        default:
          throw new ActionFailed("Unknown error.", true);
      }
    }

    return data.contents;
  };

  public static listDir = async (server: any, filePath: string) => {
    const nPath = path.normalize(filePath);

    // This removes the tailing/leading slash if its present
    // TODO: double check all conditions
    if (!FilesystemService.checkViolations(nPath, server._preset)) {
      throw new ActionFailed("Restricted file target.", false);
    }

    // Contact node
    const nodeInterface = new NodeInterface(server._nodeInstalled);

    let data;
    try {
      data = await nodeInterface.getDir(server, filePath);
    } catch (e) {
      switch (NodeInterface.niceHandle(e)) {
        case "SERVER_LOCKED":
          throw new ActionFailed("Server is locked.", true);
        case "FILE_NOT_FOUND":
          throw new ActionFailed("File not found.", true);
        default:
          throw new ActionFailed("Unknown error.", true);
      }
    }

    const files = [];
    data.contents.forEach(value => {
      if (
        server._preset.special.fs.find(rule => {
          return rule.path === path.join(nPath, value.name) && !rule.canSee;
        }) === undefined
      ) {
        files.push(value);
      }
    });

    return files;
  };
}
