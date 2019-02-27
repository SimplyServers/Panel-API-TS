import * as mongoose from "mongoose";
import { Types } from "mongoose";
import { arrayProp, post, pre, prop, Ref, Typegoose } from "typegoose";
import GameServer from "./GameServer";
import ServerNode from "./ServerNode";

@pre<Preset>("save", async function(next) {
  if (this._id === undefined || this._id === null) {
    this._id = Types.ObjectId();
  }
  next();
})
export default class Preset extends Typegoose {
  /* tslint:disable:variable-name */
  @prop() public _id?: Types.ObjectId;
  @prop() public name: string;
  @prop() public game: string;
  @prop() public autoShutdown: boolean;
  @prop() public maxPlayers: number;
  @prop() public build: {
    mem: number;
    io: number;
    cpu: number;
  };
  @prop() public special: {
    fs: any;
    views: string[];
    minecraft: {
      maxPlugins: number;
    };
  };
  @prop() public preinstalledPlugins: string[];
  @arrayProp({ itemsRef: Preset, }) public _allowSwitchingTo: Ref<Preset[]>;
  @prop() public creditsPerDay: number;
}

export const PresetModel = new Preset().getModelForClass(Preset, {
  existingMongoose: mongoose,
  schemaOptions: {collection: 'presets'}
});
