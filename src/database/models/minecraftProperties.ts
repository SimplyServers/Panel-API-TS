const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const MinecraftProperties = new Schema({
    server: String,
    settings: {
        spawnprotection: Number,
        allownether: Boolean,
        gamemode: Number,
        difficulty: Number,
        spawnmonsters: Boolean,
        pvp: Boolean,
        hardcore: Boolean,
        allowflight: Boolean,
        resourcepack: String,
        whitelist: Boolean
    }
});

module.exports = mongoose.model('MinecraftProperties', MinecraftProperties);
