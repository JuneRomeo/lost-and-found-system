const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const rateLimit = require("express-rate-limit");


const router = express.Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "Too many login attempts. Please try again after 15 minutes."
    }
});

// Admin login
router.post("/login", loginLimiter, async (req, res) => {
    try {
        const { pin } = req.body;

        if (typeof pin !== "string" || !/^\d{6}$/.test(pin)) {
            return res.status(400).json({
                message: "PIN must be exactly 6 digits."
            });
        }

        const admin = await Admin.findOne();

        if (!admin) {
            return res.status(401).json({
                message: "Invalid admin credentials."
            });
        }
        const isMatch = await bcrypt.compare(pin, admin.pin);

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid admin credentials."
            });
        }

        const token = jwt.sign(
            { role: "admin" },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );

        res.status(200).json({
            message: "Admin login successful.",
            token
        });

    } catch (error) {
        console.error("Admin login error:", error);

        res.status(500).json({
            message: "Login failed."
        });
    }
});

// Create the first admin account
router.post("/setup", (req, res) => {
    return res.status(403).json({
        message: "Admin setup is disabled."
    });
});

module.exports = router;