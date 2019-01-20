import * as mongoose from "mongoose";
import User from "./user";

const Schema = mongoose.Schema;

export interface IServerNode extends mongoose.Document {
    ip: string,
    port: number,
    secret: string,
    name: string,
    status: {
        lastOnline: Date,
        cpu: string,
        totalmem: number,
        freemem: number,
        totaldisk: number,
        freedisk: number
    },
    games: any,
    plugins: any
}

// Node is reserved... so gotta say something else!
const ServerNode = new Schema({
    ip: String,
    port: Number,
    secret: String,
    name: String,
    status: {
        lastOnline: Date,
        cpu: String,
        totalmem: Number,
        freemem: Number,
        totaldisk: Number,
        freedisk: Number
    },
    games: Object,
    plugins: Object
});

export default ServerNode;
