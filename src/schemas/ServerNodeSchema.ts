import * as mongoose from "mongoose";
import { Types } from "mongoose";
import { pre, prop, Typegoose } from "typegoose";

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
}

export const ServerNodeModel = new ServerNodeSchema().getModelForClass(ServerNodeSchema, {
  existingMongoose: mongoose,
  schemaOptions: { collection: "servernodes" }
});
