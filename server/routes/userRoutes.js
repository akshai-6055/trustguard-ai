const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { verifyToken } = require("../middleware/authMiddleware");

// All user routes are protected with JWT verification
router.use(verifyToken);

// User Profile routes
router.get("/profile", userController.getProfile);
router.put("/profile", userController.updateProfile);
router.put("/change-password", userController.changePassword);

// Employee Dashboard route
router.get("/dashboard", userController.getDashboard);

module.exports = router;
