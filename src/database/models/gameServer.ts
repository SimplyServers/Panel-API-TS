import { Types } from "mongoose";
import { pre, prop, Typegoose } from "typegoose";

@pre<GameServer>('save', async function (next) {
    if (this._id === undefined || this._id === null) {
        this._id = Types.ObjectId();
    }
    next();
})

export default class GameServer extends Typegoose {
    @prop()
    public _id?: Types.ObjectId;
    @prop()
    public owner: string;
    @prop()
    public sub_owners: string[];
    @prop()
    public preset: string;
    @prop()
    public timeOnline: number;
    @prop()
    public motd: string;
    @prop()
    public nodeInstalled: string;
    @prop()
    public sftpPassword: string;
    @prop()
    public online: boolean;
    @prop()
    public name: string;
    @prop()
    public port: number;
    @prop()
    public special: {
        minecraftPlugins: string[];
    }
}
