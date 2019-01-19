const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const Group = new Schema({
    permissions: [String],
    color: String,
    name: String,
    displayName: String,
    isAdmin: Boolean,
    isStaff: Boolean,
    presetsAllowed: [String]
});

module.exports = mongoose.model('Group', Group);
