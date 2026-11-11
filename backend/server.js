const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();


const uploadRoutes = require("./routes/uploadRoutes");
const itemRoutes = require("./routes/itemRoutes");
const claimRoutes = require("./routes/claimRoutes");
const adminAuthRoutes = require("./routes/adminAuthRoutes");


const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use("/api/upload", uploadRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/admin-auth", adminAuthRoutes);

// Test route
app.get("/", (req, res) => {
    res.send("Lost and Found API is running!");
});



// Validate required security configuration
if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is missing from the .env file.");
    process.exit(1);
}


// Server port
const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start server
const startServer = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected successfully!");

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    }
};

startServer();