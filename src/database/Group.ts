import * as mongoose from "mongoose";
import { Types } from "mongoose";
import { arrayProp, post, pre, prop, Ref, Typegoose } from "typegoose";
import GameServer from "./GameServer";
import Preset from "./Preset";

@pre<Group>("save", async function(next) {
  if (this._id === undefined || this._id === null) {
    this._id = Types.ObjectId();
  }
  next();
})
@post<Group>("findOne", async doc => {
  await doc.populate("_presetsAllowed", "-special.fs").execPopulate();
})
@post<Group>("find", async docs => {
  for (const doc of docs) {
    await doc.populate("_presetsAllowed", "-special.fs").execPopulate();
  }
})
export default class Group extends Typegoose {
  /* tslint:disable:variable-name */
  @prop() public _id?: Types.ObjectId;
  @prop() public color: string;
  @prop() public name: string;
  @prop() public displayName: string;
  @prop() public isAdmin: boolean;
  @prop() public isStaff: boolean;
  @arrayProp({ itemsRef: Preset }) public _presetsAllowed: Ref<Preset[]>;
}

export const GroupModel = new Group().getModelForClass(Group, {
  existingMongoose: mongoose,
  schemaOptions: { collection: "groups" }
});
