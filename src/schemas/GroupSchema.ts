import * as mongoose from "mongoose";
import { Types } from "mongoose";
import {
  arrayProp,
  instanceMethod,
  InstanceType,
  post,
  pre,
  prop, Ref,
  staticMethod,
  Typegoose
} from "typegoose";
import { ActionFailed } from "../util/errors/ActionFailed";
import PresetSchema from "./PresetSchema";

export interface IGroupOptions {
  _presetsAllowed: Types.ObjectId[];
  color: string;
  name: string;
  displayName: string;
  isAdmin: boolean;
  isStaff: boolean;
  _id?: string;
}

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
  @arrayProp({ itemsRef: PresetSchema }) public _presetsAllowed: Ref<
    PresetSchema[]
  >;

  @staticMethod
  public async add(options: IGroupOptions): Promise<InstanceType<GroupSchema>> {
    // Make sure the name isn't already assigned
    const existingGroups = await GroupModel.find({ name: options.name });

    if (existingGroups.length !== 0) {
      throw new ActionFailed("Name already assigned to group.", true);
    }

    const newGroup =  new GroupModel({
      color: options.color,
      displayName: options.displayName,
      name: options.name,
      isAdmin: options.isAdmin,
      isStaff: options.isStaff,
      _presetsAllowed: (options._presetsAllowed as unknown) as Ref<PresetSchema[]>
    });
    await newGroup.save();
    return newGroup;
  }

  @instanceMethod
  public async edit(options: IGroupOptions) {
    if(!options._id) { throw new Error("Must have _id"); }

    // Make sure the name isn't already assigned
    const existingGroups = await GroupModel.find({
      name: options.name
    }).orFail();

    // This is expected to be 1, especially if they aren't changing the name
    if (existingGroups[0]._id.toString() !== options._id) {
      throw new ActionFailed("Name already assigned to group.", true);
    }

    this._presetsAllowed = (options._presetsAllowed as unknown) as Ref<
      PresetSchema[]
    >;
    this.color = options.color;
    this.name = options.name;
    this.displayName = options.displayName;
    this.isAdmin = options.isAdmin;
    this.isStaff = options.isStaff;
  }
}

export const GroupModel = new GroupSchema().getModelForClass(GroupSchema, {
  existingMongoose: mongoose,
  schemaOptions: { collection: "groups" }
});
