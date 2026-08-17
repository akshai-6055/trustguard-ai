const db = require("../config/db");

// Get all devices belonging to a user
const getDevicesByUserId = async (userId) => {
    const [rows] = await db.execute(
        `SELECT
            id,
            user_id,
            device_name,
            browser,
            os,
            fingerprint,
            trust_score,
            status,
            last_used
         FROM devices
         WHERE user_id = ?
         ORDER BY last_used DESC`,
        [userId]
    );

    return rows;
};


// Get one device belonging to a user
const getDeviceById = async (deviceId, userId) => {
    const [rows] = await db.execute(
        `SELECT
            id,
            user_id,
            device_name,
            browser,
            os,
            fingerprint,
            trust_score,
            status,
            last_used
         FROM devices
         WHERE id = ? AND user_id = ?`,
        [deviceId, userId]
    );

    return rows[0];
};


// Register a new device
const createDevice = async (
    userId,
    deviceName,
    browser,
    os,
    fingerprint
) => {
    const [result] = await db.execute(
        `INSERT INTO devices
            (
                user_id,
                device_name,
                browser,
                os,
                fingerprint,
                trust_score,
                status,
                last_used
            )
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
            userId,
            deviceName,
            browser,
            os,
            fingerprint,
            100,
            "Pending"
        ]
    );

    return result.insertId;
};


// Update device status
const updateDeviceStatus = async (
    deviceId,
    userId,
    status
) => {
    const [result] = await db.execute(
        `UPDATE devices
         SET status = ?
         WHERE id = ? AND user_id = ?`,
        [status, deviceId, userId]
    );

    return result;
};


// Delete a device
const deleteDevice = async (deviceId, userId) => {
    const [result] = await db.execute(
        `DELETE FROM devices
         WHERE id = ? AND user_id = ?`,
        [deviceId, userId]
    );

    return result;
};

// Find device using fingerprint
const findDeviceByFingerprint = async (
    userId,
    fingerprint
) => {

    const [rows] = await db.execute(
        `
        SELECT
            id,
            user_id,
            device_name,
            browser,
            os,
            fingerprint,
            trust_score,
            status,
            last_used
        FROM devices
        WHERE user_id = ?
        AND fingerprint = ?
        LIMIT 1
        `,
        [
            userId,
            fingerprint
        ]
    );

    return rows[0] || null;
};


// Calculate device trust score
const calculateTrustScore = ({
    fingerprintMatch,
    browserMatch,
    osMatch,
    recentlyUsed,
    accountActive
}) => {

    let score = 0;

    // Fingerprint match
    if (fingerprintMatch) {
        score += 50;
    }

    // Browser match
    if (browserMatch) {
        score += 20;
    }

    // Operating system match
    if (osMatch) {
        score += 15;
    }

    // Device was recently used
    if (recentlyUsed) {
        score += 5;
    }

    // User account is active
    if (accountActive) {
        score += 10;
    }

    // Maximum score = 100
    return Math.min(score, 100);
};


// Determine device status from trust score
const getTrustStatus = (score) => {

    if (score >= 80) {
        return "Trusted";
    }

    if (score >= 50) {
        return "Pending";
    }

    return "Blocked";
};


// Recognize device and calculate trust
const recognizeDevice = async (
    userId,
    deviceName,
    browser,
    os,
    fingerprint,
    accountActive = true
) => {

    // Get all user's devices
    const [devices] = await db.execute(
        `
        SELECT
            id,
            user_id,
            device_name,
            browser,
            os,
            fingerprint,
            trust_score,
            status,
            last_used
        FROM devices
        WHERE user_id = ?
        `,
        [userId]
    );


    // Look for exact fingerprint
    const matchedDevice = devices.find(
        device =>
            device.fingerprint &&
            device.fingerprint === fingerprint
    );


    // =====================================================
    // EXISTING DEVICE
    // =====================================================

    if (matchedDevice) {

        const browserMatch =
            matchedDevice.browser === browser;

        const osMatch =
            matchedDevice.os === os;

        const recentlyUsed =
            matchedDevice.last_used &&
            (
                Date.now() -
                new Date(matchedDevice.last_used).getTime()
            ) <=
            30 * 24 * 60 * 60 * 1000;


        const trustScore = calculateTrustScore({
            fingerprintMatch: true,
            browserMatch,
            osMatch,
            recentlyUsed,
            accountActive
        });


        // Do not automatically override manually blocked devices
        let status = matchedDevice.status;

        if (matchedDevice.status !== "Blocked") {
            status = getTrustStatus(trustScore);
        }


        // Update device
        await db.execute(
            `
            UPDATE devices
            SET
                browser = ?,
                os = ?,
                trust_score = ?,
                status = ?,
                last_used = NOW()
            WHERE id = ?
            AND user_id = ?
            `,
            [
                browser,
                os,
                trustScore,
                status,
                matchedDevice.id,
                userId
            ]
        );


        return {
            recognized: true,
            isNew: false,
            deviceId: matchedDevice.id,
            trustScore,
            status
        };
    }


    // =====================================================
    // NEW DEVICE
    // =====================================================

    // Check whether browser and OS match another device
    const browserMatch =
        devices.some(
            device =>
                device.browser === browser
        );

    const osMatch =
        devices.some(
            device =>
                device.os === os
        );


    const trustScore = calculateTrustScore({
        fingerprintMatch: false,
        browserMatch,
        osMatch,
        recentlyUsed: false,
        accountActive
    });


    // New devices should normally be Pending
    let status = "Pending";

    if (trustScore < 50) {
        status = "Blocked";
    }


    // Insert new device
    const [result] = await db.execute(
        `
        INSERT INTO devices
        (
            user_id,
            device_name,
            browser,
            os,
            fingerprint,
            trust_score,
            status,
            last_used
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `,
        [
            userId,
            deviceName,
            browser,
            os,
            fingerprint,
            trustScore,
            status
        ]
    );


    return {
        recognized: false,
        isNew: true,
        deviceId: result.insertId,
        trustScore,
        status
    };
};

module.exports = {
    getDevicesByUserId,
    getDeviceById,
    createDevice,
    updateDeviceStatus,
    deleteDevice,

    findDeviceByFingerprint,
    calculateTrustScore,
    getTrustStatus,
    recognizeDevice
};