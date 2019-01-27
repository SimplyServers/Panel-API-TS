import { Types } from "mongoose";
import { pre, prop, Typegoose } from "typegoose";

@pre<Group>('save', async function (next) {
    if (this._id === undefined || this._id === null) {
        this._id = Types.ObjectId();
    }
    next();
})

export default class Group extends Typegoose {
    @prop()
    public _id?: Types.ObjectId;
    @prop()
    public color: string;
    @prop()
    public name: string;
    @prop()
    public displayName: string;
    @prop()
    public isAdmin: boolean;
    @prop()
    public isStaff: boolean;
    @prop()
    public presetsAllowed: string[];
}
