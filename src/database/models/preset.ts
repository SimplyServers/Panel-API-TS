import * as mongoose from "mongoose";
import User from "./user";

const Schema = mongoose.Schema;

export interface IPreset extends mongoose.Document {
    name: string,
    game: string,
    autoShutdown: boolean,
    maxPlayers: number,
    build: {
        mem: number,
        io: number,
        cpu: number
    },
    special: {
        fs: any,
        views: string[],
        minecraft: {
            maxPlugins: number
        }
    },
    preinstalledPlugins: string[],
    allowSwitchingTo: string[],
    creditsPerDay: number
}

const Preset = new Schema({
    name: String,
    game: String,
    autoShutdown: Boolean,
    maxPlayers: Number,
    build: {
        mem: Number,
        io: Number,
        cpu: Number
    },
    special: {
        fs: Array,
        views: [String],
        minecraft: {
            maxPlugins: Number
        }
    },
    preinstalledPlugins: [String],
    allowSwitchingTo: [String],
    creditsPerDay: Number
});

export default Preset;
