import { Document } from "mongoose";
import * as mongoose from "mongoose";
import User from "./user";

const Schema = mongoose.Schema;

export interface IBugReport extends mongoose.Document {
    user_id: string,
    subject: string,
    message: string,
    date: Date
    review: {
        isIssue: boolean,
        accepted: boolean,
        status: string,
        credits: number
    }
}

const BugReport = new Schema({
    user_id: String,
    subject: String,
    message: String,
    date: Date,
    review: {
        isIssue: Boolean,
        accepted: Boolean,
        status: String,
        credits: Number
    }
});

export default BugReport;
