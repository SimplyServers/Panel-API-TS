import * as mongoose from "mongoose";
import { Schema, Types } from "mongoose";
import { arrayProp, post, pre, prop, Ref, Typegoose } from "typegoose";
import MinecraftPlugin from "./MinecraftPlugin";
import Preset from "./Preset";
import ServerNode from "./ServerNode";
import User from "./User";

@pre<GameServer>("save", async function(next) {
  if (this._id === undefined || this._id === null) {
    this._id = Types.ObjectId();
  }
  next();
})
@post<GameServer>("find", async (docs) => {
  for(const doc of docs){
    await doc.populate("_sub_owners").execPopulate();
    await doc.populate({path : '_preset', populate : {path: '_allowSwitchingTo'}}).execPopulate();
    // await doc.populate("_nodeInstalled").execPopulate();
    await doc.populate("_minecraftPlugins").execPopulate();
    await doc.populate("_owner").execPopulate();

  }
})
@post<GameServer>("findOne", async (doc) => {
  await doc.populate("_sub_owners").execPopulate();
  await doc.populate({path : '_preset', populate : {path: '_allowSwitchingTo'}}).execPopulate();
  // await doc.populate("_nodeInstalled").execPopulate();
  await doc.populate("_minecraftPlugins").execPopulate();
  await doc.populate("_owner").execPopulate();

})
export default class GameServer extends Typegoose {
  /* tslint:disable:variable-name */
  @prop() public _id?: Types.ObjectId;
  @prop({ ref: User }) public _owner: Ref<User>;
  @arrayProp({ itemsRef: User }) public _sub_owners?: Ref<User[]>;
  @prop({ ref: Preset }) public _preset: Ref<Preset>;
  @prop() public timeOnline: number;
  @prop() public motd: string;
  @prop({ ref: ServerNode }) public _nodeInstalled: Ref<ServerNode>;
  @prop() public sftpPassword: string;
  @prop() public online: boolean;
  @prop() public name: string;
  @prop() public port: number;
  @arrayProp({ itemsRef: MinecraftPlugin }) public _minecraftPlugins?: Ref<
    MinecraftPlugin[]
  >;
}

export const GameServerModel = new GameServer().getModelForClass(GameServer, {
  existingMongoose: mongoose,
  schemaOptions: { collection: "gameservers" }
});
