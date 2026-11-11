const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
    {
        reportType: {
            type: String,
            enum: ["lost", "found"],
            required: true
        },

        itemName: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true
        },

        category: {
            type: String,
            required: true
        },

        location: {
            type: String,
            required: true
        },

        dateLostFound: {
            type: Date,
            required: true
        },

        imageUrl: {
            type: String,
            default: ""
        },

        imagePublicId: {
            type: String,
            default: ""
        },

        turnoverCode: {
            type: String,
            default: ""
        },

        isTurnedOver: {
            type: Boolean,
            default: false
        },

        cabinetNumber: {
            type: String,
            default: ""
        },

        shelfNumber: {
            type: String,
            default: ""
        },

        status: {
            type: String,
            enum: ["open", "claimed", "returned"],
            default: "open"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Item", itemSchema);