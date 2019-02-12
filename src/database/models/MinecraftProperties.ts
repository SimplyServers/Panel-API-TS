import { Types } from "mongoose";
import { pre, prop, Typegoose } from "typegoose";

@pre<MinecraftProperties>("save", async function(next) {
  if (this._id === undefined || this._id === null) {
    this._id = Types.ObjectId();
  }
  next();
})
export default class MinecraftProperties extends Typegoose {
  @prop()
  /* tslint:disable:variable-name */
  public _id?: Types.ObjectId;
  @prop()
  public server: string;
  @prop()
  public settings: {
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
