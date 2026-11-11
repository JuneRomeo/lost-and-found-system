
const jwt = require("jsonwebtoken");

const adminAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Access denied. Admin token required."
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role !== "admin") {
            return res.status(403).json({
                message: "Access denied. Admin privileges required."
            });
        }

        req.admin = decoded;
        next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired admin token."
        });
    }
};

module.exports = adminAuth;
