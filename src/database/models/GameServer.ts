import * as mongoose from "mongoose";
import { Schema, Types } from "mongoose";
import { pre, prop, Typegoose } from "typegoose";
import Group from "./Group";

@pre<GameServer>("save", async function(next) {
  if (this._id === undefined || this._id === null) {
    this._id = Types.ObjectId();
  }
  next();
})
export default class GameServer extends Typegoose {
  @prop()
  /* tslint:disable:variable-name */
  public _id?: Types.ObjectId;
  @prop({ref: 'users'})
  public _owner: Types.ObjectId;
  @prop({ref: 'users'})
  public _sub_owners: Types.ObjectId[];
  @prop({ref: 'presets'})
  public _preset: Types.ObjectId;
  @prop()
  public timeOnline: number;
  @prop()
  public motd: string;
  @prop({ref: 'servernodes'})
  public _nodeInstalled: Types.ObjectId;
  @prop()
  public sftpPassword: string;
  @prop()
  public online: boolean;
  @prop()
  public name: string;
  @prop()
  public port: number;
  @prop()
  public special: {
    minecraftPlugins: string[];
  };
}

export const GameServerModel = new GameServer().getModelForClass(GameServer, {
  existingMongoose: mongoose,
  schemaOptions: {collection: 'gameservers'}
});
