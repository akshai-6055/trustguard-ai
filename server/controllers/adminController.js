const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
// Get Admin Dashboard Data
exports.getDashboard = async (req, res) => {
    try {
        const dashboardData = await userModel.getAdminDashboardData();
        return res.status(200).json({
            success: true,
            dashboard: dashboardData
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve admin dashboard data.",
            error: err.message
        });
    }
};

// ============================================================
// User Management
// ============================================================

exports.getAllUsers = async (req, res) => {
    try {
        const users = await userModel.getAllUsers();
        return res.status(200).json({ success: true, users });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to fetch users.", error: err.message });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        const users = await userModel.findUserById(userId);
        if (!users || users.length === 0) {
            return res.status(404).json({ success: false, message: "User not found." });
        }
        return res.status(200).json({ success: true, user: users[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to fetch user.", error: err.message });
    }
};

exports.updateUserStatus = async (req, res) => {
    try {
        const userId = req.params.id;
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).json({ success: false, message: "Status is required." });
        }
        
        await userModel.updateUserStatus(userId, status);
        return res.status(200).json({ success: true, message: `User status updated to ${status}.` });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to update user status.", error: err.message });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { full_name, email, password, role_id } = req.body;
        
        if (!full_name || !email || !password || !role_id) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }
        
        // Check if user already exists
        const existingUsers = await userModel.findUserByEmail(email);
        if (existingUsers && existingUsers.length > 0) {
            return res.status(400).json({ success: false, message: "Email already exists." });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = {
            full_name,
            email,
            password: hashedPassword,
            role_id: Number(role_id)
        };
        
        const result = await userModel.createUser(newUser);
        return res.status(201).json({ success: true, message: "User created successfully.", userId: result.insertId });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to create user.", error: err.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const { full_name, email, role_id, account_status, password } = req.body;
        
        if (!full_name || !email || !role_id || !account_status) {
            return res.status(400).json({ success: false, message: "Required fields are missing." });
        }
        
        const existingUsers = await userModel.findUserByEmailExcludingId(email, userId);
        if (existingUsers && existingUsers.length > 0) {
            return res.status(400).json({ success: false, message: "Email already in use." });
        }
        
        const updatedUser = {
            full_name,
            email,
            role_id: Number(role_id),
            account_status
        };
        
        if (password) {
            updatedUser.password = await bcrypt.hash(password, 10);
        }
        
        await userModel.updateUserAdmin(userId, updatedUser);
        return res.status(200).json({ success: true, message: "User updated successfully." });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to update user.", error: err.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        await userModel.deleteUser(userId);
        return res.status(200).json({ success: true, message: "User deleted successfully." });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to delete user.", error: err.message });
    }
};

// ============================================================
// Device Management
// ============================================================
const deviceModel = require("../models/deviceModel");

exports.getAllDevices = async (req, res) => {
    try {
        const devices = await deviceModel.getAllDevices();
        return res.status(200).json({ success: true, devices });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to fetch devices.", error: err.message });
    }
};

exports.updateDeviceStatus = async (req, res) => {
    try {
        const deviceId = req.params.id;
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).json({ success: false, message: "Status is required." });
        }
        
        await deviceModel.updateDeviceStatusAdmin(deviceId, status);
        return res.status(200).json({ success: true, message: `Device status updated to ${status}.` });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to update device status.", error: err.message });
    }
};

exports.deleteDevice = async (req, res) => {
    try {
        const deviceId = req.params.id;
        await deviceModel.deleteDeviceAdmin(deviceId);
        return res.status(200).json({ success: true, message: "Device deleted successfully." });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to delete device.", error: err.message });
    }
};

// ============================================================
// AI Risk Assessment / Continuous Auth Overview
// ============================================================
const db = require("../config/db");

exports.getRiskAssessmentData = async (req, res) => {
    try {
        // Device trust distribution
        const [trustDist] = await db.query(`
            SELECT status, COUNT(*) AS count
            FROM devices
            GROUP BY status
        `);

        // Users with low-trust devices
        const [highRiskUsers] = await db.query(`
            SELECT
                u.id, u.full_name, u.email,
                d.device_name, d.trust_score, d.status, d.browser, d.os, d.last_used
            FROM devices d
            JOIN users u ON d.user_id = u.id
            WHERE d.trust_score < 50
            ORDER BY d.trust_score ASC
            LIMIT 20
        `);

        // Avg trust score per user
        const [avgTrustPerUser] = await db.query(`
            SELECT u.full_name, u.email,
                   ROUND(AVG(d.trust_score), 1) AS avg_trust,
                   COUNT(d.id) AS device_count
            FROM users u
            JOIN devices d ON d.user_id = u.id
            GROUP BY u.id
            ORDER BY avg_trust ASC
            LIMIT 10
        `);

        return res.status(200).json({
            success: true,
            data: { trustDist, highRiskUsers, avgTrustPerUser }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to load risk data.", error: err.message });
    }
};

// ============================================================
// Security Alerts
// ============================================================
exports.getSecurityAlerts = async (req, res) => {
    try {
        // Failed login attempts
        const [failedLogins] = await db.query(`
            SELECT
                lh.id, u.full_name, u.email,
                lh.login_time, lh.device_name, lh.browser, lh.location, lh.status
            FROM login_history lh
            LEFT JOIN users u ON lh.user_id = u.id
            WHERE lh.status != 'Success'
            ORDER BY lh.id DESC
            LIMIT 50
        `);

        // Blocked devices
        const [blockedDevices] = await db.query(`
            SELECT d.id, d.device_name, d.trust_score, d.last_used, d.browser, d.os,
                   u.full_name, u.email
            FROM devices d
            JOIN users u ON d.user_id = u.id
            WHERE d.status = 'Blocked'
            ORDER BY d.last_used DESC
            LIMIT 20
        `);

        // Blocked users
        const [blockedUsers] = await db.query(`
            SELECT id, full_name, email, account_status, created_at
            FROM users
            WHERE LOWER(account_status) != 'active'
            ORDER BY id DESC
            LIMIT 20
        `);

        return res.status(200).json({
            success: true,
            alerts: { failedLogins, blockedDevices, blockedUsers }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to load security alerts.", error: err.message });
    }
};

// ============================================================
// Audit Logs
// ============================================================
exports.getAuditLogs = async (req, res) => {
    try {
        const [logs] = await db.query(`
            SELECT
                lh.id,
                u.full_name,
                u.email,
                u.role_id,
                lh.login_time,
                lh.device_name,
                lh.browser,
                lh.location,
                lh.status
            FROM login_history lh
            LEFT JOIN users u ON lh.user_id = u.id
            ORDER BY lh.id DESC
            LIMIT 200
        `);

        return res.status(200).json({ success: true, logs });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to load audit logs.", error: err.message });
    }
};
