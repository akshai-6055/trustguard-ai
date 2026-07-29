const express = require("express");
const router = express.Router();

// Import Controller
const authController = require("../controllers/authController");

// Import Middleware
const { verifyToken } = require("../middleware/authMiddleware");

// Public Routes
router.post("/register", authController.register);
router.post("/login", authController.login);

// Protected Routes
router.get("/profile", verifyToken, authController.getProfile);

module.exports = router;