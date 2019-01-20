import * as mongoose from "mongoose";

const Schema = mongoose.Schema;

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

module.exports = mongoose.model('BugReport', BugReport);
