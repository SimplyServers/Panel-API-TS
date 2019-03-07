import { Types } from "mongoose";
import * as mongoose from "mongoose";
import { instanceMethod, pre, prop, Typegoose } from "typegoose";

@pre<MinecraftPluginSchema>("save", async function(next) {
  if (this._id === undefined || this._id === null) {
    this._id = Types.ObjectId();
  }
  next();
})
export default class MinecraftPluginSchema extends Typegoose {
  /* tslint:disable:variable-name */
  @prop() public _id?: Types.ObjectId;
  @prop() public name: string;
  @prop() public games: any;
  @prop() public credits: number;
  @prop() public reloadRequired: boolean;
  @prop() public description: string;
  @instanceMethod
  public checkComp(game: any) {
    let works = false;

    this.games.map(value => {
      if (value === game) {
        works = true;
      }
    });

    return works;
  }
}

export const MinecraftPluginModel = new MinecraftPluginSchema().getModelForClass(
  MinecraftPluginSchema,
  {
    existingMongoose: mongoose,
    schemaOptions: { collection: "minecraftplugins" }
  }
);
