import { Types } from "mongoose";
import * as mongoose from "mongoose";
import { pre, prop, Typegoose } from "typegoose";

@pre<BugreportSchema>("save", async function(next) {
  if (this._id === undefined || this._id === null) {
    this._id = Types.ObjectId();
  }
  next();
})
export default class BugreportSchema extends Typegoose {
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

export const BugreportModel = new BugreportSchema().getModelForClass(BugreportSchema, {
  existingMongoose: mongoose,
  schemaOptions: { collection: "bugreports" }
});
