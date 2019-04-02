import * as mongoose from "mongoose";
import { Types } from "mongoose";
import {
  arrayProp,
  instanceMethod,
  InstanceType,
  pre,
  prop,
  Ref,
  staticMethod,
  Typegoose
} from "typegoose";
import { ActionFailed } from "../util/errors/ActionFailed";

export interface IPresetOptions {
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

@pre<PresetSchema>("save", async function(next) {
  if (this._id === undefined || this._id === null) {
    this._id = Types.ObjectId();
  }
  next();
})
export default class PresetSchema extends Typegoose {
  /* tslint:disable:variable-name */
  @prop() public _id?: Types.ObjectId;
  @prop() public name: string;
  @prop() public game: string;
  @prop() public autoShutdown: boolean;
  @prop() public maxPlayers: number;
  @prop() public build: {
    mem: number;
    io: number;
    cpu: number;
  };
  @prop() public special: {
    fs: any;
    views: string[];
    minecraft: {
      maxPlugins: number;
    };
  };

  @prop() public preinstalledPlugins: string[];
  @arrayProp({ itemsRef: PresetSchema }) public _allowSwitchingTo: Ref<
    PresetSchema[]
  >;
  @prop() public creditsPerDay: number;

  @staticMethod
  public async add(options: IPresetOptions): Promise<InstanceType<PresetSchema>> {
    // Make sure the name isn't already assigned
    const existingPresets = await PresetModel.find({ name: options.name });
    if (existingPresets.length !== 0) {
      throw new ActionFailed("Name already assigned to preset.", true);
    }

    const newPreset = new PresetModel({
      name: options.name,
      game: options.game,
      autoShutdown: options.autoShutdown,
      maxPlayers: options.maxPlayers,
      build: {
        mem: options.build.mem,
        io: options.build.io,
        cpu: options.build.cpu
      },
      special: {
        fs: options.special.fs,
        views: options.special.views,
        minecraft: {}
      },
      preinstalledPlugins: options.preinstalledPlugins,
      _allowSwitchingTo: (options._allowSwitchingTo as unknown) as Ref<
        PresetSchema[]
      >,
      creditsPerDay: options.creditsPerDay
    });

    if (options.special.minecraft && options.special.minecraft.maxPlugins) {
      newPreset.special.minecraft.maxPlugins =
        options.special.minecraft.maxPlugins;
    }

    await newPreset.save();
    return newPreset;
  }

  @instanceMethod
  public async edit(options: IPresetOptions) {
    if(!options._id) { throw new Error("Must have _id"); }

    // Make sure the name isn't already assigned
    const existingPresets = await PresetModel.find({
      name: options.name
    }).orFail();

    // This is expected to be 1, especially if they aren't changing the name
    if (existingPresets[0]._id.toString() !== options._id) {
      // Only fire this if the preset we're editing is NOT this
      throw new ActionFailed("Name already assigned to preset.", true);
    }

    this.name = options.name;
    this.game = options.game;
    this.build.mem = options.build.mem;
    this.build.io = options.build.io;
    this.build.cpu = options.build.cpu;
    this.special.fs = options.special.fs;
    this.special.views = options.special.views;
    this.autoShutdown = options.autoShutdown;
    this.creditsPerDay = options.creditsPerDay;
    this.preinstalledPlugins = options.preinstalledPlugins;
    this._allowSwitchingTo = (options._allowSwitchingTo as unknown) as Ref<
      PresetSchema[]
    >;
    this.maxPlayers = options.maxPlayers;

    if (options.special.minecraft && options.special.minecraft.maxPlugins) {
      this.special.minecraft.maxPlugins = options.special.minecraft.maxPlugins;
    }
  }
}

export const PresetModel = new PresetSchema().getModelForClass(PresetSchema, {
  existingMongoose: mongoose,
  schemaOptions: { collection: "presets" }
});
