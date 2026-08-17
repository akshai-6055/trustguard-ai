const express = require("express");
const router = express.Router();

const {
    getMyDevices,
    getDevice,
    registerDevice,
    updateDeviceTrust,
    deleteDevice
} = require("../controllers/deviceController");

const {verifyToken} = require("../middleware/authMiddleware");

// All device routes require JWT authentication
router.use(verifyToken);

// Get all devices
router.get("/", getMyDevices);

// Get one device
router.get("/:id", getDevice);

// Register a device
router.post("/", registerDevice);

// Trust or untrust a device
router.put("/:id/trust", updateDeviceTrust);

// Delete a device
router.delete("/:id", deleteDevice);

module.exports = router;