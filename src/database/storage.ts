import { Models } from "../types/models";
import { ActionFailed } from "../util/errors/ActionFailed";

const mongoose = require("mongoose");

export class Storage {
  static getItems = async (model: Models, condition: any, rule: any) => {
    const mongooseModel = Storage.getModel(model);

    let modelData;
    try {
      if (rule !== undefined) {
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

  static getItem = async (model: Models, id: string, rule: any) => {
    const mongooseModel = Storage.getModel(model);

    let modelData;
    try {
      if (rule !== undefined) {
        modelData = await mongooseModel.findOne({ _id: id }, rule);
      } else {
        modelData = await mongooseModel.findOne({ _id: id });
      }
    } catch (e) {
      throw new ActionFailed("Failed to find " + model.toString() + ".", true);
    }

    if (!modelData) {
      throw new ActionFailed("Failed to find " + model.toString() + ".", true);
    }
    return modelData;
  };

  static removeItem = async (model: Models, id: string) => {
    const mongooseModel = Storage.getModel(model);

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

  static getItemByCon = async (model: Models, condition: any, rule: any) => {
    const mongooseModel = Storage.getModel(model);

    let modelData;
    try {
      if (rule !== undefined) {
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

  static getAll = async (model: Models, rule: any) => {
    const mongooseModel = Storage.getModel(model);

    let modelData;
    try {
      if (rule !== undefined) {
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
    return mongoose.model(model.toString());
  };
}
