import * as mongoose from "mongoose";
import { Types } from "mongoose";
import { pre, prop, Typegoose } from "typegoose";
import Preset from "./Preset";

@pre<MinecraftProperties>("save", async function(next) {
  if (this._id === undefined || this._id === null) {
    this._id = Types.ObjectId();
  }
  next();
})
export default class MinecraftProperties extends Typegoose {
  /* tslint:disable:variable-name */
  @prop() public _id?: Types.ObjectId;
  @prop() public server: string;
  @prop() public settings: {
    spawnprotection: number;
    allownether: boolean;
    gamemode: number;
    difficulty: number;
    spawnmonsters: boolean;
    pvp: boolean;
    hardcore: boolean;
    allowflight: boolean;
    resourcepack: string;
    whitelist: boolean;
  };
}

export const MinecraftPropertiesModel = new MinecraftProperties().getModelForClass(MinecraftProperties, {
  existingMongoose: mongoose,
  schemaOptions: {collection: 'minecraftproperties'}
});
