import { Types } from "mongoose";
import { Ref } from "typegoose";
import { GroupModel } from "../../database/Group";
import Preset from "../../database/Preset";
import { ActionFailed } from "../../util/errors/ActionFailed";

export interface IGroupQuery {
  _presetsAllowed: Types.ObjectId[];
  color: string;
  name: string;
  displayName: string;
  isAdmin: boolean;
  isStaff: boolean;
}


export class Group{
  public getGroups = async () => {
    return await GroupModel.find({});
  };

  public getGroup = async (objectID: string) => {
    return await GroupModel.findById(Types.ObjectId(objectID)).orFail();

  };

  public removeGroup = async (objectID: string) => {
    let group;
    group = await GroupModel.findByIdAndDelete(Types.ObjectId(objectID)).orFail();
    // Make sure we removed more then 0
    if (group.n < 1) {
      throw new ActionFailed("Failed to find group matching id", true);
    }
  };

  public editGroup = async (editQuery: IGroupQuery) => {
    // Make sure the name isn't already assigned
    const existingGroups = await GroupModel.find({ name: editQuery.name }).orFail();

    if (existingGroups.length !== 0) {
      // This is expected to be 1, especially if they aren't changing the name
      if (existingGroups[0]._id.toString() !== editQuery.name) {
        // Only fire this if the group we're editing is NOT this
        throw new ActionFailed("Name already assigned to group.", true);
      }
    } else {
      throw new ActionFailed("Failed to find group matching id", true);
    }

    const existingGroup = existingGroups[0];

    existingGroup._presetsAllowed = editQuery._presetsAllowed as unknown as Ref<Preset[]>;
    existingGroup.color = editQuery.color;
    existingGroup.name = editQuery.name;
    existingGroup.displayName = editQuery.displayName;
    existingGroup.isAdmin = editQuery.isAdmin;
    existingGroup.isStaff = editQuery.isStaff;

    await existingGroup.save();
  };

  public addGroup = async (addQuery: IGroupQuery) => {
    // Make sure the name isn't already assigned
    const existingGroups = await GroupModel.find({name: addQuery.name});

    if (existingGroups.length !== 0) {
      throw new ActionFailed("Name already assigned to group.", true);
    }

    const newGroup = new GroupModel({
      color: addQuery.color,
      displayName: addQuery.displayName,
      name: addQuery.name,
      isAdmin: addQuery.isAdmin,
      isStaff: addQuery.isStaff,
      _presetsAllowed: addQuery._presetsAllowed as unknown as Ref<Preset[]>
    });

    await newGroup.save();
  };
}