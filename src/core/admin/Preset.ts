import { Types } from "mongoose";
import { pre, Ref } from "typegoose";
import PresetSchema, { PresetModel } from "../../schemas/PresetSchema";
import { ActionFailed } from "../../util/errors/ActionFailed";
import { DatabaseItem } from "../DatabaseItem";

export interface IPresetQuery {
  name: string;
  game: string;
  build: {
    mem: number;
    io: number;
    cpu: number;
  };
  special: {
    fs: any;
    views: any;
    minecraft?: {
      maxPlugins?: number;
    };
  };
  autoShutdown: boolean;
  creditsPerDay: number;
  preinstalledPlugins: string[];
  _allowSwitchingTo: Types.ObjectId[];
  maxPlayers: number;
  _id?: string;
}

export class Preset implements DatabaseItem {
  public static get = async () => {
    return await PresetModel.find({});
  };

  public static getOne = async (objectID: string) => {
    return await PresetModel.findById(Types.ObjectId(objectID)).orFail();
  };

  public static remove = async (objectID: string) => {
    await PresetModel.findByIdAndDelete(Types.ObjectId(objectID)).orFail();
  };

  public static edit = async (presetQuery: IPresetQuery) => {
    // Make sure the name isn't already assigned
    const existingPresets = await PresetModel.find({
      name: presetQuery.name
    }).orFail();

    // This is expected to be 1, especially if they aren't changing the name
    if (existingPresets[0]._id.toString() !== presetQuery._id) {
      // Only fire this if the preset we're editing is NOT this
      throw new ActionFailed("Name already assigned to preset.", true);
    }

    const existingPreset = existingPresets[0];

    existingPreset.name = presetQuery.name;
    existingPreset.game = presetQuery.game;
    existingPreset.build.mem = presetQuery.build.mem;
    existingPreset.build.io = presetQuery.build.io;
    existingPreset.build.cpu = presetQuery.build.cpu;
    existingPreset.special.fs = presetQuery.special.fs;
    existingPreset.special.views = presetQuery.special.views;
    existingPreset.autoShutdown = presetQuery.autoShutdown;
    existingPreset.creditsPerDay = presetQuery.creditsPerDay;
    existingPreset.preinstalledPlugins = presetQuery.preinstalledPlugins;
    existingPreset._allowSwitchingTo = (presetQuery._allowSwitchingTo as unknown) as Ref<
      PresetSchema[]
    >;
    existingPreset.maxPlayers = presetQuery.maxPlayers;

    if (
      presetQuery.special.minecraft &&
      presetQuery.special.minecraft.maxPlugins
    ) {
      existingPreset.special.minecraft.maxPlugins =
        presetQuery.special.minecraft.maxPlugins;
    }

    await existingPreset.save();
  };

  public static add = async (addQuery: IPresetQuery) => {
    // Make sure the name isn't already assigned
    const existingPresets = await PresetModel.find({ name: addQuery.name });
    if (existingPresets.length !== 0) {
      throw new ActionFailed("Name already assigned to preset.", true);
    }

    const newPreset = new PresetModel({
      name: addQuery.name,
      game: addQuery.game,
      autoShutdown: addQuery.autoShutdown,
      maxPlayers: addQuery.maxPlayers,
      build: {
        mem: addQuery.build.mem,
        io: addQuery.build.io,
        cpu: addQuery.build.cpu
      },
      special: {
        fs: addQuery.special.fs,
        views: addQuery.special.views,
        minecraft: {}
      },
      preinstalledPlugins: addQuery.preinstalledPlugins,
      _allowSwitchingTo: (addQuery._allowSwitchingTo as unknown) as Ref<
        PresetSchema[]
      >,
      creditsPerDay: addQuery.creditsPerDay
    });

    if (addQuery.special.minecraft && addQuery.special.minecraft.maxPlugins) {
      newPreset.special.minecraft.maxPlugins =
        addQuery.special.minecraft.maxPlugins;
    }

    await newPreset.save();
  };
}
