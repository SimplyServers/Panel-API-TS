import { Types } from "mongoose";
import { Ref } from "typegoose";
import { GroupModel } from "../../schemas/GroupSchema";
import PresetSchema from "../../schemas/PresetSchema";
import { ActionFailed } from "../../util/errors/ActionFailed";
import { DatabaseService } from "../DatabaseService";

export interface IGroupQuery {
  _presetsAllowed: Types.ObjectId[];
  color: string;
  name: string;
  displayName: string;
  isAdmin: boolean;
  isStaff: boolean;
  _id?: string;
}

export class GroupService implements DatabaseService {
  public static get = async () => {
    return await GroupModel.find({});
  };

  public static getOne = async (objectID: string) => {
    return await GroupModel.findById(Types.ObjectId(objectID)).orFail();
  };

  public static remove = async (objectID: string) => {
    GroupModel.findByIdAndDelete(
      Types.ObjectId(objectID)
    ).orFail();
  };

  public static edit = async (editQuery: IGroupQuery) => {
    // Make sure the name isn't already assigned
    const existingGroups = await GroupModel.find({
      name: editQuery.name
    }).orFail();

    // This is expected to be 1, especially if they aren't changing the name
    if (existingGroups[0]._id.toString() !== editQuery._id) {
      // Only fire this if the group we're editing is NOT this
      throw new ActionFailed("Name already assigned to group.", true);
    }

    const existingGroup = existingGroups[0];

    existingGroup._presetsAllowed = (editQuery._presetsAllowed as unknown) as Ref<PresetSchema[]>;
    existingGroup.color = editQuery.color;
    existingGroup.name = editQuery.name;
    existingGroup.displayName = editQuery.displayName;
    existingGroup.isAdmin = editQuery.isAdmin;
    existingGroup.isStaff = editQuery.isStaff;

    await existingGroup.save();
  };

  public static add = async (addQuery: IGroupQuery) => {
    // Make sure the name isn't already assigned
    const existingGroups = await GroupModel.find({ name: addQuery.name });

    if (existingGroups.length !== 0) {
      throw new ActionFailed("Name already assigned to group.", true);
    }

    const newGroup = new GroupModel({
      color: addQuery.color,
      displayName: addQuery.displayName,
      name: addQuery.name,
      isAdmin: addQuery.isAdmin,
      isStaff: addQuery.isStaff,
      _presetsAllowed: (addQuery._presetsAllowed as unknown) as Ref<PresetSchema[]>
    });

    await newGroup.save();
  };
}
