const express = require("express");
const Item = require("../models/Item");
const crypto = require("crypto");
const adminAuth = require("../middleware/adminAuth");
const Claim = require("../models/Claim");
const cloudinary = require("../config/cloudinary");


const router = express.Router();

// Admin: Get all items, including storage locations
router.get("/admin", adminAuth, async (req, res) => {
    try {
        const items = await Item.find().sort({ createdAt: -1 });

        res.status(200).json(items);

    } catch (error) {
        console.error("Failed to retrieve admin items:", error);

        res.status(500).json({
            message: "Failed to retrieve admin items."
        });
    }
});

// Get all lost and found items (Public)
router.get("/", async (req, res) => {
    try {
        const items = await Item.find({
            status: { $ne: "returned" }
        })
        .select("-cabinetNumber -shelfNumber -turnoverCode")
        .sort({ createdAt: -1 });

        res.status(200).json(items);

    } catch (error) {
        res.status(500).json({
            message: "Failed to retrieve items.",
            error: error.message
        });
    }
});

// Search lost and found items
router.get("/search", async (req, res) => {
    try {
        const query = req.query.query;

        const items = await Item.find({
                status: { $ne: "returned" },
                $or: [
                    { itemName: { $regex: query, $options: "i" } },
                    { description: { $regex: query, $options: "i" } }
                ]
            })
            .select("-cabinetNumber -shelfNumber -turnoverCode")
            .sort({ createdAt: -1 });

        res.status(200).json(items);

    } catch (error) {
        res.status(500).json({
            message: "Search failed.",
            error: error.message
        });
    }
});

// Report a lost item
router.post("/lost", async (req, res) => {
    try {
        const {
            itemName,
            description,
            category,
            location,
            dateLostFound,
            imageUrl,
            imagePublicId
        } = req.body;

        if (!itemName || !description || !category || !location || !dateLostFound) {
            return res.status(400).json({
                message: "Please provide all required item details."
            });
        }

        const newItem = await Item.create({
            reportType: "lost",
            itemName,
            description,
            category,
            location,
            dateLostFound,
            imageUrl,
            imagePublicId
        });

        res.status(201).json({
            message: "Lost item reported successfully!",
            item: newItem
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to report lost item.",
            error: error.message
        });
    }
});

// Get one item by ID
router.get("/:id", async (req, res) => {
    try {
            if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
                return res.status(400).json({
                    message: "Invalid item ID."
                });
            }

          const item = await Item.findOne({
                _id: req.params.id,
                status: { $ne: "returned" }
            })
            .select("-cabinetNumber -shelfNumber -turnoverCode");

        if (!item) {
            return res.status(404).json({
                message: "Item not found."
            });
        }

        res.status(200).json(item);

    } catch (error) {
        res.status(500).json({
            message: "Failed to retrieve item.",
            error: error.message
        });
    }
});

// Report a found item
router.post("/found", async (req, res) => {
    try {
        const {
            itemName,
            description,
            category,
            location,
            dateLostFound,
            imageUrl,
            imagePublicId
        } = req.body;

        if (!itemName || !description || !category || !location || !dateLostFound) {
            return res.status(400).json({
                message: "Please provide all required item details."
            });
        }

        const turnoverCode = "FOUND-" + crypto.randomBytes(4).toString("hex").toUpperCase();

        const newItem = await Item.create({
            reportType: "found",
            itemName,
            description,
            category,
            location,
            dateLostFound,
            imageUrl,
            imagePublicId,
            turnoverCode
        });

        res.status(201).json({
            message: "Found item reported successfully!",
            item: newItem
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to report found item.",
            error: error.message
        });
    }
});

// Admin: Delete a lost item report
router.delete("/:id", adminAuth, async (req, res) => {
    try {
        const { id } = req.params;

        if (!/^[0-9a-fA-F]{24}$/.test(id)) {
            return res.status(400).json({
                message: "Invalid item ID."
            });
        }

        const item = await Item.findById(id);

        if (!item) {
            return res.status(404).json({
                message: "Item not found."
            });
        }

        if (item.reportType !== "lost") {
            return res.status(403).json({
                message: "Only lost item reports can be deleted here."
            });
        }

        const existingClaim = await Claim.findOne({ item: id });

        if (existingClaim) {
            return res.status(400).json({
                message: "This report has submitted claims and cannot be deleted."
            });
        }

        if (item.imagePublicId) {
            await cloudinary.uploader.destroy(item.imagePublicId);
        }

        await Item.findByIdAndDelete(id);

        res.status(200).json({
            message: "Lost item report deleted successfully."
        });

    } catch (error) {
        console.error("Error deleting lost item:", error);

        res.status(500).json({
            message: "Failed to delete lost item report."
        });
    }
});

// Update item status
router.patch("/:id/status", adminAuth, async (req, res) => {
    try {
        const { status } = req.body;

        if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
        return res.status(400).json({
            message: "Invalid item ID."
        });
}

        const allowedStatuses = ["open", "claimed", "returned"];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid item status."
            });
        }

        const updatedItem = await Item.findByIdAndUpdate(
            req.params.id,
            { status: status },
            {
                returnDocument: "after",
                runValidators: true
            }
        );

        if (!updatedItem) {
            return res.status(404).json({
                message: "Item not found."
            });
        }

        res.json({
            message: "Item status updated successfully!",
            item: updatedItem
        });

    } catch (error) {
        console.error("Error updating item status:", error);

        res.status(500).json({
            message: "Failed to update item status."
        });
    }
});

// Front Desk: Record item turnover
router.patch("/:id/turnover", adminAuth, async (req, res) => {
    try {
        const { cabinetNumber, shelfNumber } = req.body;

        if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
        return res.status(400).json({
            message: "Invalid item ID."
        });
    }

        if (
            !cabinetNumber?.trim() ||
            !shelfNumber?.trim()
        ) {
            return res.status(400).json({
                message: "Cabinet number and shelf number are required."
            });
        }

        const item = await Item.findById(req.params.id);

        if (!item) {
            return res.status(404).json({
                message: "Item not found."
            });
        }

        if (item.reportType !== "found") {
            return res.status(400).json({
                message: "Only found items can be turned over."
            });
        }

        if (item.isTurnedOver) {
            return res.status(400).json({
                message: "This item has already been turned over."
            });
        }

        item.isTurnedOver = true;
        item.cabinetNumber = cabinetNumber.trim();
        item.shelfNumber = shelfNumber.trim();

        await item.save();

        res.status(200).json({
            message: "Item successfully recorded as turned over!",
            item
        });

    } catch (error) {
        console.error("Error recording item turnover:", error);

        res.status(500).json({
            message: "Failed to record item turnover."
        });
    }
});

module.exports = router;