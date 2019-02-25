import * as mongoose from "mongoose";
import { Schema, Types } from "mongoose";
import { pre, prop, Ref, Typegoose } from "typegoose";
import Group from "./Group";
import Preset from "./Preset";
import ServerNode from "./ServerNode";
import User from "./User";

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
  @prop({ref: User})
  public _owner: Ref<User>;
  @prop({ref: User})
  public _sub_owners: Array<Ref<User>>;
  @prop({ref: Preset})
  public _preset: Ref<Preset>;
  @prop()
  public timeOnline: number;
  @prop()
  public motd: string;
  @prop({ref: ServerNode})
  public _nodeInstalled: Ref<ServerNode>;
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
