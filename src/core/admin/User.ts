import { Types } from "mongoose";
import { UserModel } from "../../schemas/UserSchema";
import { DatabaseItem } from "../DatabaseItem";

export class User implements DatabaseItem{
  public static get = async () => {
    return await UserModel.find({}, { "account_info.password": 0 });
  };

  public static getOne = async (objectID: string) => {
    return await UserModel.findById(Types.ObjectId(objectID)).orFail();
  };
}
