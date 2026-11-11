const express = require("express");
const Claim = require("../models/Claim");
const Item = require("../models/Item");
const crypto = require("crypto");
const adminAuth = require("../middleware/adminAuth");
const mongoose = require("mongoose");

const router = express.Router();

// Submit a claim
router.post("/", async (req, res) => {
    try {
        const {
            item,
            claimantName,
            contactNumber,
            email,
            claimDetails,
            signatureData,
            proofImageUrl,
            proofImagePublicId
        } = req.body;

        if (
            !item ||
            !claimantName?.trim() ||
            !contactNumber?.trim() ||
            !claimDetails?.trim() ||
            !signatureData?.trim()
        ) {
            return res.status(400).json({
                message: "Please complete all required fields."
            });
        }

        const cleanName = claimantName.trim();
        const cleanContact = contactNumber.trim();
        const cleanEmail = (email || "").trim().toLowerCase();
        const cleanDetails = claimDetails.trim();

        if (!/^[0-9+\-\s()]{7,20}$/.test(cleanContact)) {
            return res.status(400).json({
                message: "Please enter a valid contact number."
            });
        }

        if (
            cleanEmail &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
        ) {
            return res.status(400).json({
                message: "Please enter a valid email address."
            });
        }

        const existingItem = await Item.findById(item);

        if (!existingItem) {
            return res.status(404).json({
                message: "Item not found."
            });
        }

        if (existingItem.reportType !== "found") {
            return res.status(400).json({
                message: "Only found items can be claimed."
            });
        }

        if (existingItem.status !== "open") {
            return res.status(400).json({
                message: "This item is no longer available for claiming."
            });
        }

        const claimReference =
            "CLM-" + crypto.randomBytes(8).toString("hex").toUpperCase();

        const newClaim = new Claim({
            item,
            claimantName: cleanName,
            claimReference,
            contactNumber: cleanContact,
            email: cleanEmail,
            claimDetails: cleanDetails,
            signatureData,
            proofImageUrl: proofImageUrl || "",
            proofImagePublicId: proofImagePublicId || ""
        });

        const savedClaim = await newClaim.save();

        res.status(201).json({
            message: "Claim submitted successfully!",
            claimReference: savedClaim.claimReference,
            claim: savedClaim
        });

    } catch (error) {
        console.error("Error submitting claim:", error);

        res.status(500).json({
            message: "Failed to submit claim."
        });
    }
});


// Track a claim using its reference number
// Track a claim using its reference number
router.get("/track/:claimReference", async (req, res) => {
    try {
        const claim = await Claim.findOne({
            claimReference: req.params.claimReference
        }).populate("item", "itemName category location");

        if (!claim) {
            return res.status(404).json({
                message: "Claim reference not found."
            });
        }

        res.json({
            claimReference: claim.claimReference,
            status: claim.status,
            item: claim.item,
            rejectionReason: claim.rejectionReason,
            returnedAt: claim.returnedAt
        });

    } catch (error) {
        console.error("Error tracking claim:", error);

        res.status(500).json({
            message: "Failed to track claim."
        });
    }
});


// Get all submitted claims (admin only)
router.get("/", adminAuth, async (req, res) => {
    try {
        const claims = await Claim.find()
            .populate(
                "item",
                "itemName category location reportType status cabinetNumber shelfNumber"
            )
            .sort({ createdAt: -1 });

        res.json(claims);

    } catch (error) {
        console.error("Error fetching claims:", error);

        res.status(500).json({
            message: "Failed to retrieve claims."
        });
    }
});


// Approve or reject a submitted claim (admin only)
router.patch("/:id/status", adminAuth, async (req, res) => {
    try {
        const { status, rejectionReason } = req.body;

        if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({
                message: "Status must be approved or rejected."
            });
        }

        if (status === "rejected" && !rejectionReason?.trim()) {
        return res.status(400).json({
            message: "Please provide a reason for rejecting this claim."
        });
        }

        const claim = await Claim.findById(req.params.id);

        if (!claim) {
            return res.status(404).json({
                message: "Claim not found."
            });
        }

        if (claim.status !== "pending") {
            return res.status(400).json({
                message: "This claim has already been reviewed."
            });
        }

        if (status === "approved") {
            const updatedItem = await Item.findOneAndUpdate(
                {
                    _id: claim.item,
                    reportType: "found",
                    status: "open"
                },
                {
                    status: "claimed"
                },
                {
                    returnDocument: "after",
                    runValidators: true
                }
            );

            if (!updatedItem) {
                return res.status(400).json({
                    message: "This item is no longer available for claiming."
                });
            }
        }

        const updateData = {
                status,
                rejectionReason: status === "rejected"
                    ? rejectionReason.trim()
                    : ""
            };

            const updatedClaim = await Claim.findByIdAndUpdate(
                req.params.id,
                updateData,
            {
                returnDocument: "after",
                runValidators: true
            }
            );

        res.json({
            message: status === "approved"
                ? "Claim approved. Item marked as claimed."
                : "Claim rejected successfully!",
            claim: updatedClaim
        });

    } catch (error) {
        console.error("Error updating claim status:", error);

        res.status(500).json({
            message: "Failed to update claim status."
        });
    }
});


// Mark an approved claim and its item as returned (admin only)
router.patch("/:id/return", adminAuth, async (req, res) => {
    const session = await mongoose.startSession();

    try {
        let updatedClaim;

        await session.withTransaction(async () => {
            const claim = await Claim.findOne({
                _id: req.params.id,
                status: "approved"
            }).session(session);

            if (!claim) {
                throw new Error("CLAIM_NOT_APPROVED");
            }

            const updatedItem = await Item.findOneAndUpdate(
                {
                    _id: claim.item,
                    reportType: "found",
                    status: "claimed"
                },
                {
                    status: "returned"
                },
                {
                    returnDocument: "after",
                    runValidators: true,
                    session
                }
            );

            if (!updatedItem) {
                throw new Error("ITEM_NOT_AVAILABLE");
            }

            updatedClaim = await Claim.findOneAndUpdate(
                {
                    _id: claim._id,
                    status: "approved"
                },
                {
                    status: "returned",
                    returnedAt: new Date()
                },
                {
                    returnDocument: "after",
                    runValidators: true,
                    session
                }
            );

            if (!updatedClaim) {
                throw new Error("CLAIM_UPDATE_FAILED");
            }
        });

        res.json({
            message: "Item successfully returned and recorded!",
            claim: updatedClaim
        });

    } catch (error) {
        if (error.message === "CLAIM_NOT_APPROVED") {
            return res.status(400).json({
                message: "Only approved claims can be marked as returned."
            });
        }

        if (error.message === "ITEM_NOT_AVAILABLE") {
            return res.status(400).json({
                message: "The found item is not available for return."
            });
        }

        console.error("Error returning item:", error);

        res.status(500).json({
            message: "Failed to record returned item."
        });

    } finally {
        await session.endSession();
    }
});


module.exports = router;