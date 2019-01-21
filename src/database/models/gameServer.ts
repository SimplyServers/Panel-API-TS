import * as mongoose from "mongoose";

const Schema = mongoose.Schema;

export interface IServer extends mongoose.Document {
    owner: string,
    sub_owners: string[],
    preset: string,
    timeOnline: number,
    motd: string,
    nodeInstalled: string,
    sftpPassword: string,
    online: boolean,
    name: string,
    port: number,
    special: {
        minecraftPlugins: string[]
    }
}

const GameServer = new Schema({
    owner: String,
    sub_owners: [String],
    preset: String,
    timeOnline: Number,
    motd: String,
    nodeInstalled: String,
    sftpPassword: String,
    online: Boolean,
    name: String,
    port: Number,
    special: {
        minecraftPlugins: [String]
    }
});

export default GameServer;
