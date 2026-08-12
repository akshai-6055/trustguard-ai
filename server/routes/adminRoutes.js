const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");

// All admin routes require JWT verification and Administrator role authorization
router.use(verifyToken);
router.use(authorizeRoles(1, "Administrator", "Admin"));

// Admin Dashboard route
router.get("/dashboard", adminController.getDashboard);

module.exports = router;
