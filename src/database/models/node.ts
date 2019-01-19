const mongoose = require('mongoose');

const Schema = mongoose.Schema;

//Node is reserved... so gotta say something else!
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

module.exports = mongoose.model('Node', ServerNode);
