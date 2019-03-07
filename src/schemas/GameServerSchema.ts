import * as mongoose from "mongoose";
import { Schema, Types } from "mongoose";
import { arrayProp, post, pre, prop, Ref, Typegoose } from "typegoose";
import MinecraftPluginSchema from "./MinecraftPluginSchema";
import PresetSchema from "./PresetSchema";
import ServerNodeSchema from "./ServerNodeSchema";
import UserSchema from "./UserSchema";

@pre<GameServerSchema>("save", async function(next) {
  if (this._id === undefined || this._id === null) {
    this._id = Types.ObjectId();
  }
  next();
})
@post<GameServerSchema>("find", async docs => {
  for (const doc of docs) {
    await doc
      .populate("_sub_owners", "_id account_info.username")
      .execPopulate();
    await doc.populate("_preset").execPopulate();
    await doc.populate("_minecraftPlugins").execPopulate();
    await doc
      .populate(
        "_owner",
        "_id account_info.username _minecraftBoughtPlugins balance"
      )
      .execPopulate();
  }
})
@post<GameServerSchema>("findOne", async doc => {
  await doc.populate("_sub_owners", "_id account_info.username").execPopulate();
  await doc.populate("_preset").execPopulate();
  await doc.populate("_minecraftPlugins").execPopulate();
  await doc
    .populate(
      "_owner",
      "_id account_info.username _minecraftBoughtPlugins balance"
    )
    .execPopulate();
})
export default class GameServerSchema extends Typegoose {
  /* tslint:disable:variable-name */
  @prop() public _id?: Types.ObjectId;
  @prop({ ref: UserSchema }) public _owner: Ref<UserSchema>;
  @arrayProp({ itemsRef: UserSchema }) public _sub_owners?: Ref<UserSchema[]>;
  @prop({ ref: PresetSchema }) public _preset: Ref<PresetSchema>;
  @prop() public timeOnline: number;
  @prop() public motd: string;
  @prop({ ref: ServerNodeSchema }) public _nodeInstalled: Ref<ServerNodeSchema>;
  @prop() public sftpPassword: string;
  @prop() public online: boolean;
  @prop() public name: string;
  @prop() public port: number;
  @arrayProp({ itemsRef: MinecraftPluginSchema }) public _minecraftPlugins?: Ref<
    MinecraftPluginSchema[]
  >;
}

export const GameServerModel = new GameServerSchema().getModelForClass(GameServerSchema, {
  existingMongoose: mongoose,
  schemaOptions: { collection: "gameservers" }
});
