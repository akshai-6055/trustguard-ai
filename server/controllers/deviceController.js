const deviceModel = require("../models/deviceModel");

// Get all devices of the logged-in user
const getMyDevices = async (req, res) => {
    try {
        const userId = req.user.id;

        const devices = await deviceModel.getDevicesByUserId(userId);

        res.status(200).json({
            success: true,
            count: devices.length,
            devices
        });

    } catch (error) {
        console.error("Get devices error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve devices"
        });
    }
};


// Get one specific device
const getDevice = async (req, res) => {
    try {
        const userId = req.user.id;
        const deviceId = req.params.id;

        const device = await deviceModel.getDeviceById(
            deviceId,
            userId
        );

        if (!device) {
            return res.status(404).json({
                success: false,
                message: "Device not found"
            });
        }

        res.status(200).json({
            success: true,
            device
        });

    } catch (error) {
        console.error("Get device error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve device"
        });
    }
};


// Register a new device
const registerDevice = async (req, res) => {
    try {
        const userId = req.user.id;

        const {
            device_name,
            browser,
            os,
            fingerprint
        } = req.body;

        // Validate required fields
        if (!device_name || !browser || !os || !fingerprint) {
            return res.status(400).json({
                success: false,
                message: "Device name, browser, OS and fingerprint are required"
            });
        }

        // Create device
        const deviceId = await deviceModel.createDevice(
            userId,
            device_name,
            browser,
            os,
            fingerprint
        );

        res.status(201).json({
            success: true,
            message: "Device registered successfully",
            device_id: deviceId
        });

    } catch (error) {
        console.error("Register device error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to register device"
        });
    }
};

// Update device trust status
// Update device trust status
const updateDeviceTrust = async (req, res) => {
    try {
        const userId = req.user.id;
        const deviceId = req.params.id;

        const { status } = req.body;

        // Validate status
        const allowedStatuses = ["Trusted", "Pending", "Blocked"];

        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status. Use Trusted, Pending or Blocked."
            });
        }

        // Check whether device belongs to logged-in user
        const device = await deviceModel.getDeviceById(
            deviceId,
            userId
        );

        if (!device) {
            return res.status(404).json({
                success: false,
                message: "Device not found"
            });
        }

        // Update status
        await deviceModel.updateDeviceStatus(
            deviceId,
            userId,
            status
        );

        res.status(200).json({
            success: true,
            message: `Device status updated to ${status}`
        });

    } catch (error) {
        console.error("Update device trust error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update device trust status"
        });
    }
};

// Delete a device
const deleteDevice = async (req, res) => {
    try {
        const userId = req.user.id;
        const deviceId = req.params.id;

        // Check device exists
        const device = await deviceModel.getDeviceById(
            deviceId,
            userId
        );

        if (!device) {
            return res.status(404).json({
                success: false,
                message: "Device not found"
            });
        }

        await deviceModel.deleteDevice(
            deviceId,
            userId
        );

        res.status(200).json({
            success: true,
            message: "Device removed successfully"
        });

    } catch (error) {
        console.error("Delete device error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to remove device"
        });
    }
};


module.exports = {
    getMyDevices,
    getDevice,
    registerDevice,
    updateDeviceTrust,
    deleteDevice
};