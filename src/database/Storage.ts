import { Models } from "../types/Models";
import { ActionFailed } from "../util/errors/ActionFailed";
import GameServer from "./models/GameServer";
import Group from "./models/Group";
import MinecraftPlugin from "./models/MinecraftPlugin";
import MinecraftProperties from "./models/MinecraftProperties";
import ServerNode from "./models/ServerNode";
import Preset from "./models/Preset";
import User from "./models/User";

import * as mongoose from "mongoose";

export interface IConditionOptions {
  model: Models,
  condition: any,
  rule?: any,
  allowEmpty?: boolean
}

export interface IIDOptions {
  model: Models,
  id: string,
  rule?: any,
  allowEmpty?: boolean
}

export interface IGeneralOptions {
  model: Models;
  rule?: any;
}

export class Storage {
  public static getItems = async (options: IConditionOptions) => {
    const mongooseModel = Storage.getModel(options.model);

    let modelData;
    try {
      if (options.rule) {
        modelData = await mongooseModel.find(options.condition, options.rule);
      } else {
        modelData = await mongooseModel.find(options.condition);
      }
    } catch (e) {
      throw new ActionFailed("Failed to find " + options.model.toString() + "s.", true);
    }
    if (!modelData) {
      throw new ActionFailed("Failed to find " + options.model.toString() + "s.", true);
    }
    return modelData;
  };

  public static getItem = async (options: IIDOptions) => {
    const mongooseModel: InstanceType<any> = Storage.getModel(options.model);

    let modelData;
    try {
      if (options.rule) {
        modelData = await mongooseModel.findOne({_id: new mongoose.Types.ObjectId(options.id)}, options.rule)
      } else {
        modelData = await mongooseModel.findOne({_id: new mongoose.Types.ObjectId(options.id)})
      }
    } catch (e) {
      throw new ActionFailed("Failed to find " + options.model.toString() + ".", true);
    }

    if (!modelData) {
      throw new ActionFailed("Failed to find " + options.model.toString() + ".", true);
    }
    return modelData;
  };

  public static removeItem = async (options: IIDOptions) => {
    const mongooseModel: InstanceType<any> = Storage.getModel(options.model);

    let modelData;
    try {
      modelData = await mongooseModel.deleteOne({_id: new mongoose.Types.ObjectId(options.id)});
    } catch (e) {
      throw new ActionFailed(
        "Failed to remove " + options.model.toString() + ".",
        true
      );
    }
    if (!modelData) {
      throw new ActionFailed(
        "Failed to remove " + options.model.toString() + ".",
        true
      );
    }
    return modelData;
  };

  public static getItemByCon = async (options: IConditionOptions) => {
    const mongooseModel: InstanceType<any> = Storage.getModel(options.model);

    mongooseModel.findOne({});

    let modelData;
    try {
      if (options.rule) {
        modelData = await mongooseModel.findOne(options.condition, options.rule);
      } else {
        modelData = await mongooseModel.findOne(options.condition);
      }
    } catch (e) {
      throw new ActionFailed("Failed to find " + options.model.toString() + ".", true);
    }
    if (!modelData) {
      throw new ActionFailed("Failed to find " + options.model.toString() + ".", true);
    }
    return modelData;
  };

  public static getAll = async (options: IGeneralOptions) => {
    const mongooseModel: InstanceType<any> = Storage.getModel(options.model);

    let modelData;
    try {
      if (options.rule) {
        modelData = await mongooseModel.find({}, options.rule);
      } else {
        modelData = await mongooseModel.find({});
      }
    } catch (e) {
      throw new ActionFailed("Failed to find " + options.model.toString() + "s.", true);
    }
    if (!modelData) {
      throw new ActionFailed("Failed to find " + options.model.toString() + "s.", true);
    }
    return modelData;
  };

  // https://github.com/vkarpov15/mongo-sanitize/blob/master/index.js
  public static mongoSterlize(condition: object) {
    if (condition instanceof Object) {
      for (const key in condition) {
        if (/^\$/.test(key)) {
          delete condition[key];
        }
      }
    }
    return condition;
  }

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
