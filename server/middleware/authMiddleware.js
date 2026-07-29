const jwt = require("jsonwebtoken");

// Middleware to verify JWT Token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];

    // Check if Authorization header is present
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Access Denied. No token provided or invalid token format."
        });
    }

    // Extract Token
    const token = authHeader.split(" ")[1];

    try {
        // Verify Token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach decoded payload { id, email, role_id } to request object
        next(); // Move to the next middleware or controller
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: "Invalid or expired token."
        });
    }
};

module.exports = {
    verifyToken
};
