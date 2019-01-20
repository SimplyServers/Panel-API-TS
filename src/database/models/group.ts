import * as mongoose from "mongoose";

const Schema = mongoose.Schema;

export interface IGroup extends mongoose.Document {
    permissions: string[],
    color: string,
    name: string,
    displayName: string,
    isAdmin: boolean,
    isStaff: boolean,
    presetsAllowed: string[]
}

const Group = new Schema({
    permissions: [String],
    color: String,
    name: String,
    displayName: String,
    isAdmin: Boolean,
    isStaff: Boolean,
    presetsAllowed: [String]
});

export default Group;
