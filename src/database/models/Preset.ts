import * as mongoose from "mongoose";
import { Types } from "mongoose";
import { pre, prop, Ref, Typegoose } from "typegoose";
import ServerNode from "./ServerNode";

@pre<Preset>("save", async function(next) {
  if (this._id === undefined || this._id === null) {
    this._id = Types.ObjectId();
  }
  next();
})
export default class Preset extends Typegoose {
  @prop()
  /* tslint:disable:variable-name */
  public _id?: Types.ObjectId;
  @prop()
  public name: string;
  @prop()
  public game: string;
  @prop()
  public autoShutdown: boolean;
  @prop()
  public maxPlayers: number;
  @prop()
  public build: {
    mem: number;
    io: number;
    cpu: number;
  };
  @prop()
  public special: {
    fs: any;
    views: string[];
    minecraft: {
      maxPlugins: number;
    };
  };
  @prop()
  public preinstalledPlugins: string[];
  @prop({ref: Preset})
  public _allowSwitchingTo: Array<Ref<Preset>>;
  @prop()
  public creditsPerDay: number;
}

export const PresetModel = new Preset().getModelForClass(Preset, {
  existingMongoose: mongoose,
  schemaOptions: {collection: 'presets'}
});
