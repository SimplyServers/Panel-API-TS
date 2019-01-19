const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const Preset = new Schema({
    name: String,
    game: String,
    autoShutdown: Boolean,
    maxPlayers: Number,
    build: {
        mem: Number,
        io: Number,
        cpu: Number
    },
    special: {
        fs: Array,
        views: [String],
        minecraft: {
            maxPlugins: Number
        }
    },
    preinstalledPlugins: [String],
    allowSwitchingTo: [String],
    creditsPerDay: Number
});

module.exports = mongoose.model('Preset', Preset);
