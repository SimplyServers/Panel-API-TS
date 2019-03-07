import * as mongoose from "mongoose";
import { Types } from "mongoose";
import { arrayProp, post, pre, prop, Ref, Typegoose } from "typegoose";
import GameServerSchema from "./GameServerSchema";
import PresetSchema from "./PresetSchema";

@pre<GroupSchema>("save", async function(next) {
  if (this._id === undefined || this._id === null) {
    this._id = Types.ObjectId();
  }
  next();
})
@post<GroupSchema>("findOne", async doc => {
  await doc.populate("_presetsAllowed", "-special.fs").execPopulate();
})
@post<GroupSchema>("find", async docs => {
  for (const doc of docs) {
    await doc.populate("_presetsAllowed", "-special.fs").execPopulate();
  }
})
export default class GroupSchema extends Typegoose {
  /* tslint:disable:variable-name */
  @prop() public _id?: Types.ObjectId;
  @prop() public color: string;
  @prop() public name: string;
  @prop() public displayName: string;
  @prop() public isAdmin: boolean;
  @prop() public isStaff: boolean;
  @arrayProp({ itemsRef: PresetSchema }) public _presetsAllowed: Ref<PresetSchema[]>;
}

export const GroupModel = new GroupSchema().getModelForClass(GroupSchema, {
  existingMongoose: mongoose,
  schemaOptions: { collection: "groups" }
});

