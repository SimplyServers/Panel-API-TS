import * as mongoose from "mongoose";
import { Types } from "mongoose";
import { arrayProp, pre, prop, Ref, Typegoose } from "typegoose";
import MinecraftProperties from "./MinecraftProperties";
import Preset from "./Preset";
import User from "./User";

@pre<Group>("save", async function(next) {
  if (this._id === undefined || this._id === null) {
    this._id = Types.ObjectId();
  }
  next();
})
export default class Group extends Typegoose {
  @prop()
  /* tslint:disable:variable-name */
  public _id?: Types.ObjectId;
  @prop()
  public color: string;
  @prop()
  public name: string;
  @prop()
  public displayName: string;
  @prop()
  public isAdmin: boolean;
  @prop()
  public isStaff: boolean;
  @arrayProp({ itemsRef: Preset })
  public _presetsAllowed: Ref<Preset[]>;
}

export const GroupModel = new Group().getModelForClass(Group, {
  existingMongoose: mongoose,
  schemaOptions: {collection: 'groups'}
});
