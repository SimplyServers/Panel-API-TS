import { Types } from "mongoose";
import { ServerNodeModel } from "../../schemas/ServerNodeSchema";
import { ActionFailed } from "../../util/errors/ActionFailed";
import { DatabaseItem } from "../DatabaseItem";

export interface INodeQuery {
  ip: string;
  name: string;
  secret: string;
  port: number;
  _id: string;
}

export class Node implements DatabaseItem {
  public static get = async () => {
    return await ServerNodeModel.find({});
  };

  public static getOne = async (objectID: string) => {
    return await ServerNodeModel.findById(Types.ObjectId(objectID)).orFail();
  };

  public static remove = async (objectID: string) => {
    await ServerNodeModel.findByIdAndDelete(Types.ObjectId(objectID)).orFail();
  };

  public static edit = async (editQuery: INodeQuery) => {
    // Make sure the name isn't already assigned
    const existingNodes = await ServerNodeModel.find({
      name: editQuery.name
    }).orFail();

    // This is expected to be 1, especially if they aren't changing the name
    if (existingNodes[0]._id.toString() !== editQuery._id) {
      // Only fire this if the node we're editing is NOT this
      throw new ActionFailed("Name already assigned to node.", true);
    }

    const existingNode = existingNodes[0];
    existingNode.ip = editQuery.ip;
    existingNode.name = editQuery.name;
    existingNode.secret = editQuery.secret;
    existingNode.port = editQuery.port;

    await existingNode.save();
  };

  public static add = async (newQuery: INodeQuery) => {
    // Make sure the name isn't already assigned
    let existingNodes;

    existingNodes = await ServerNodeModel.find({ name: newQuery.name });
    if (existingNodes.length !== 0) {
      throw new ActionFailed("Name already assigned to node.", true);
    }

    const newNode = new ServerNodeModel({
      ip: newQuery.ip,
      name: newQuery.name,
      secret: newQuery.secret,
      port: newQuery.port
    });

    await newNode.save();
  };
}
