import { Models } from "../types/models";
import { ActionFailed } from "../util/errors/ActionFailed";
import GameServer from "./models/gameServer";
import Group from "./models/group";
import MinecraftPlugin from "./models/minecraftPlugin";
import MinecraftProperties from "./models/minecraftProperties";
import ServerNode from "./models/node";
import Preset from "./models/preset";
import User from "./models/user";

export class Storage {
  public static getItems = async (model: Models, condition: any, rule?: any) => {
    const mongooseModel = Storage.getModel(model);

    console.log("befoe:" +JSON.stringify(condition));
    console.log("condition: " + JSON.stringify(condition));

    let modelData;
    try {
      if (rule) {
        modelData = await mongooseModel.find(condition, rule);
      } else {
        modelData = await mongooseModel.find(condition);
      }
    } catch (e) {
      throw new ActionFailed("Failed to find " + model.toString() + "s.", true);
    }
    if (!modelData) {
      throw new ActionFailed("Failed to find " + model.toString() + "s.", true);
    }
    return modelData;
  };

  public static getItem = async (model: Models, id: string, rule?: any) => {
    const mongooseModel: InstanceType<any> = Storage.getModel(model);

    let modelData;
    try {
      if (rule) {
        modelData = await mongooseModel.findOne({ _id: id }, rule);
      } else {
        modelData = await mongooseModel.findOne({ _id: id });
      }
    } catch (e) {
      throw new ActionFailed("Failed to find " + model.toString() + ".", true);
    }

    if (!modelData) {
      console.log("Failed: ID " + id, ", model: " + model.toString());
      throw new ActionFailed("Failed to find " + model.toString() + ".", true);
    }
    return modelData;
  };

  public static removeItem = async (model: Models, id: string) => {
    const mongooseModel: InstanceType<any> = Storage.getModel(model);

    let modelData;
    try {
      modelData = await mongooseModel.deleteOne({ _id: id });
    } catch (e) {
      throw new ActionFailed(
        "Failed to remove " + model.toString() + ".",
        true
      );
    }
    if (!modelData) {
      throw new ActionFailed(
        "Failed to remove " + model.toString() + ".",
        true
      );
    }
    return modelData;
  };

  public static getItemByCon = async (model: Models, condition: any, rule?: any) => {
    const mongooseModel: InstanceType<any> = Storage.getModel(model);

    mongooseModel.findOne({});

    let modelData;
    try {
      if (rule) {
        modelData = await mongooseModel.findOne(condition, rule);
      } else {
        modelData = await mongooseModel.findOne(condition);
      }
    } catch (e) {
      throw new ActionFailed("Failed to find " + model.toString() + ".", true);
    }
    if (!modelData) {
      throw new ActionFailed("Failed to find " + model.toString() + ".", true);
    }
    return modelData;
  };

  public static getAll = async (model: Models, rule?: any) => {
    const mongooseModel: InstanceType<any> = Storage.getModel(model);

    let modelData;
    try {
      if (rule) {
        modelData = await mongooseModel.find({}, rule);
      } else {
        modelData = await mongooseModel.find({});
      }
    } catch (e) {
      throw new ActionFailed("Failed to find " + model.toString() + "s.", true);
    }
    if (!modelData) {
      throw new ActionFailed("Failed to find " + model.toString() + "s.", true);
    }
    return modelData;
  };

  private static getModel = (model: Models) => {
    // return mongoose.model(model.toString());
    switch (model) {
      case Models.User:
        return new User().getModelForClass(User);
      case Models.Group:
        return new Group().getModelForClass(Group);
      case Models.GameServer:
        return new GameServer().getModelForClass(GameServer);
      case Models.MinecraftPlugin:
        return new MinecraftPlugin().getModelForClass(MinecraftPlugin);
      case Models.MinecraftProperties:
        return new MinecraftProperties().getModelForClass(MinecraftProperties);
      case Models.Node:
        return new ServerNode().getModelForClass(ServerNode);
      case Models.Preset:
        return new Preset().getModelForClass(Preset);
    }
  };
}
