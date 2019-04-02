import * as mongoose from "mongoose";
import { Types } from "mongoose";
import { instanceMethod, InstanceType, pre, prop, staticMethod, Typegoose } from "typegoose";
import { ActionFailed } from "../util/errors/ActionFailed";

export interface INodeOptions {
  ip: string;
  name: string;
  secret: string;
  port: number;
  _id?: string;
}

@pre<ServerNodeSchema>("save", async function(next) {
  if (this._id === undefined || this._id === null) {
    this._id = Types.ObjectId();
  }
  next();
})
export default class ServerNodeSchema extends Typegoose {
  /* tslint:disable:variable-name */
  @prop() public _id?: Types.ObjectId;
  @prop() public ip: string;
  @prop() public port: number;
  @prop() public secret: string;
  @prop() public name: string;
  @prop() public status: {
    lastOnline?: any; // TODO: talk with Andrew
    cpu?: string;
    totalmem?: number;
    freemem?: number;
    totaldisk?: number;
    freedisk?: number;
  };
  @prop() public games: any;
  @prop() public plugins: any;

  @instanceMethod
  public async edit(options: INodeOptions){
    // Make sure the name isn't already assigned
    const existingNodes = await ServerNodeModel.find({
      name: options.name
    }).orFail();

    // This is expected to be 1, especially if they aren't changing the name
    if (existingNodes[0]._id.toString() !== options._id) {
      // Only fire this if the node we're editing is NOT this
      throw new ActionFailed("Name already assigned to node.", true);
    }

    this.ip = options.ip;
    this.name = options.name;
    this.secret = options.secret;
    this.port = options.port;
  }

  @staticMethod
  public async add(options: INodeOptions): Promise<InstanceType<ServerNodeSchema>> {
    // Make sure the name isn't already assigned
    let existingNodes;

    existingNodes = await ServerNodeModel.find({ name: options.name });
    if (existingNodes.length !== 0) {
      throw new ActionFailed("Name already assigned to node.", true);
    }

    const newNode =  new ServerNodeModel({
      ip: options.ip,
      name: options.name,
      secret: options.secret,
      port: options.port
    });
    await newNode.save();
    return newNode;
  }

}

export const ServerNodeModel = new ServerNodeSchema().getModelForClass(ServerNodeSchema, {
  existingMongoose: mongoose,
  schemaOptions: { collection: "servernodes" }
});
