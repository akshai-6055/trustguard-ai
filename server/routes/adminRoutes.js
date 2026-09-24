const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const policyController = require("../controllers/policyController");
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");

// All admin routes require JWT verification and Administrator role authorization
router.use(verifyToken);
router.use(authorizeRoles(1, "Administrator", "Admin"));

// Admin Dashboard route
router.get("/dashboard", adminController.getDashboard);

// User Management Routes
router.get("/users", adminController.getAllUsers);
router.get("/users/:id", adminController.getUserById);
router.post("/users", adminController.createUser);
router.put("/users/:id", adminController.updateUser);
router.put("/users/:id/status", adminController.updateUserStatus);
router.delete("/users/:id", adminController.deleteUser);

// Device Management Routes
router.get("/devices", adminController.getAllDevices);
router.put("/devices/:id/status", adminController.updateDeviceStatus);
router.delete("/devices/:id", adminController.deleteDevice);

// Policy Management Routes
router.get("/policies", policyController.getAllPolicies);
router.get("/policies/:id", policyController.getPolicyById);
router.post("/policies", policyController.createPolicy);
router.put("/policies/:id", policyController.updatePolicy);
router.delete("/policies/:id", policyController.deletePolicy);

// AI Risk Assessment / Continuous Auth
router.get("/risk-assessment", adminController.getRiskAssessmentData);

// Security Alerts
router.get("/security-alerts", adminController.getSecurityAlerts);

// Audit Logs
router.get("/audit-logs", adminController.getAuditLogs);

module.exports = router;

