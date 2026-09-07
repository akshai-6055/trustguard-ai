const express = require("express");

const router = express.Router();

const {
    verifyToken
} = require("../middleware/authMiddleware");

const continuousAuthController =
    require("../controllers/continuousAuthController");


// ============================================================
// CONTINUOUS AUTHENTICATION
// ============================================================

// Evaluate whether the currently authenticated user
// should be allowed to access a protected resource.

router.post(
    "/evaluate",
    verifyToken,
    continuousAuthController.evaluateAccess
);


module.exports = router;