const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema(
    {
        item: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Item",
            required: true
        },

        claimantName: {
            type: String,
            required: true,
            trim: true
        },

        claimReference: {
            type: String,
            unique: true,
            required: true
        },

        contactNumber: {
            type: String,
            required: true
        },

        email: {
            type: String,
            trim: true,
            lowercase: true
        },

        claimDetails: {
            type: String,
            required: true
        },

        signatureData: {
            type: String,
            required: true
        },

        proofImageUrl: {
            type: String,
            default: ""
        },

        proofImagePublicId: {
            type: String,
            default: ""
        },

        status: {
            type: String,
            enum: ["pending", "approved", "rejected", "returned"],
            default: "pending"
        },
        rejectionReason: {
            type: String,
            trim: true,
            default: ""
        },

        returnedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Claim", claimSchema);