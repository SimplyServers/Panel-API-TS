import * as mongoose from "mongoose";

const Schema = mongoose.Schema;

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

module.exports = mongoose.model("MinecraftPlugin", MinecraftPlugin);
