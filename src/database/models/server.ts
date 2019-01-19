const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const Server = new Schema({
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

module.exports = mongoose.model('Server', Server);
