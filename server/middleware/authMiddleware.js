const db = require('../config/db');
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
        req.user = decoded; // Attach decoded payload { id, email, role_id, role_name } to request object
        next(); // Move to the next middleware or controller
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token."
        });
    }
};

// Middleware to authorize specific roles
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please authenticate first."
            });
        }

        const userRole = req.user.role_id;
        const userRoleName = req.user.role_name ? req.user.role_name.toLowerCase() : "";

        // Normalize allowed roles (supports role IDs like 1, 2 or string names like "Administrator", "Admin", "Employee")
        const isAuthorized = allowedRoles.some((role) => {
            if (typeof role === "number") {
                return userRole === role;
            }
            if (typeof role === "string") {
                const lowerRole = role.toLowerCase();
                if (lowerRole === "admin" || lowerRole === "administrator") {
                    return userRole === 1 || userRoleName === "admin" || userRoleName === "administrator";
                }
                if (lowerRole === "employee") {
                    return userRole === 2 || userRoleName === "employee";
                }
                return userRoleName === lowerRole;
            }
            return false;
        });

        if (!isAuthorized) {
            return res.status(403).json({
                success: false,
                message: "Forbidden. You do not have permission to access this resource."
            });
        }

        next();
    };
};

const authorizePermissions = (...requiredPermissions) => {
    return async (req, res, next) => {
        if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized.' });
        try {
            const [userRows] = await db.query(`SELECT role_id FROM users WHERE id = ?`, [req.user.id]);
            if (!userRows || userRows.length === 0) return res.status(401).json({ success: false, message: 'User not found.' });
            const roleId = userRows[0].role_id;
            const [permsRows] = await db.query(`SELECT p.permission_name FROM role_permissions rp JOIN permissions p ON rp.permission_id = p.permission_id WHERE rp.role_id = ?`, [roleId]);
            const userPermissions = permsRows.map(p => p.permission_name);
            const hasPermissions = requiredPermissions.every(perm => userPermissions.includes(perm));
            if (!hasPermissions) return res.status(403).json({ success: false, message: 'Forbidden.' });
            next();
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Internal error.' });
        }
    };
};

module.exports = {
    verifyToken,
    authorizeRoles,
    authorizePermissions
};