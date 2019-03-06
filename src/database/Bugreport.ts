import { Types } from "mongoose";
import * as mongoose from "mongoose";
import { pre, prop, Typegoose } from "typegoose";

@pre<Bugreport>("save", async function(next) {
  if (this._id === undefined || this._id === null) {
    this._id = Types.ObjectId();
  }
  next();
})
export default class Bugreport extends Typegoose {
  /* tslint:disable:variable-name */
  @prop() public _id?: Types.ObjectId;
  @prop() public user_id: string;
  @prop() public subject: string;
  @prop() public message: string;
  @prop() public date: Date;
  @prop() public review: {
    isIssue: boolean;
    accepted: boolean;
    status: string;
    credits: number;
  };
}

export const BugreportModel = new Bugreport().getModelForClass(Bugreport, {
  existingMongoose: mongoose,
  schemaOptions: { collection: "bugreports" }
});
