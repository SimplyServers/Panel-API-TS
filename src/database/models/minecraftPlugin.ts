import * as mongoose from "mongoose";

const Schema = mongoose.Schema;

export interface IMinecraftPlugin extends mongoose.Document {
  name: string,
  games: any,
  credits: number,
  reloadRequired: boolean,
  description: string
}

const MinecraftPlugin = new Schema({
  name: String,
  games: Array,
  credits: Number,
  reloadRequired: Boolean,
  description: String
});

MinecraftPlugin.methods.checkComp = function(game) {
  let works = false;

  this.games.map(value => {
    if (value === game) works = true;
  });

  return works;
};

export default MinecraftPlugin;
