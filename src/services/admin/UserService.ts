import { Types } from "mongoose";
import { UserModel } from "../../schemas/UserSchema";
import { DatabaseService } from "../DatabaseService";

export class UserService implements DatabaseService{
  public static get = async () => {
    return await UserModel.find({}, { "account_info.password": 0 });
  };

  public static getOne = async (objectID: string) => {
    return await UserModel.findById(Types.ObjectId(objectID)).orFail();
  };
}
