import * as mongoose from "mongoose";
import User from "./user";

const Schema = mongoose.Schema;

export interface IMinecraftProperties extends mongoose.Document {
    server: string,
    settings: {
        spawnprotection: number,
        allownether: boolean,
        gamemode: number,
        difficulty: number,
        spawnmonsters: boolean,
        pvp: boolean,
        hardcore: boolean,
        allowflight: boolean,
        resourcepack: string,
        whitelist: boolean
    }
}

const MinecraftProperties = new Schema({
    server: String,
    settings: {
        spawnprotection: Number,
        allownether: Boolean,
        gamemode: Number,
        difficulty: Number,
        spawnmonsters: Boolean,
        pvp: Boolean,
        hardcore: Boolean,
        allowflight: Boolean,
        resourcepack: String,
        whitelist: Boolean
    }
});

export default MinecraftProperties;
