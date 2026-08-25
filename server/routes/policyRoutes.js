const express = require("express");

const router = express.Router();

const policyController = require("../controllers/policyController");

const { verifyToken, authorizeRoles } =
    require("../middleware/authMiddleware");


// ============================================================
// GET ALL POLICIES
// ============================================================
// Authenticated users can view policies
router.get(
    "/",
    verifyToken,
    policyController.getAllPolicies
);


// ============================================================
// GET SINGLE POLICY
// ============================================================
// Authenticated users can view a specific policy
router.get(
    "/:id",
    verifyToken,
    policyController.getPolicyById
);


// ============================================================
// CREATE POLICY
// ============================================================
// Only Admin can create policies
router.post(
    "/",
    verifyToken,
    authorizeRoles("Admin"),
    policyController.createPolicy
);


// ============================================================
// UPDATE POLICY
// ============================================================
// Only Admin can update policies
router.put(
    "/:id",
    verifyToken,
    authorizeRoles("Admin"),
    policyController.updatePolicy
);


// ============================================================
// DELETE POLICY
// ============================================================
// Only Admin can delete policies
router.delete(
    "/:id",
    verifyToken,
    authorizeRoles("Admin"),
    policyController.deletePolicy
);


module.exports = router;