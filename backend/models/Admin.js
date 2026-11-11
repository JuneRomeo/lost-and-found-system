const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
    pin: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model("Admin", adminSchema);