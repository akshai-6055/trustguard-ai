const db = require("../config/db");

// ============================================================
// Get complete user information
// ============================================================
const getUserById = async (userId) => {
    const sql = `
        SELECT
            u.id,
            u.full_name,
            u.email,
            u.role_id,
            u.account_status,
            r.role_name
        FROM users u
        JOIN roles r
            ON u.role_id = r.id
        WHERE u.id = ?
        LIMIT 1
    `;

    const [rows] = await db.query(sql, [userId]);

    return rows[0] || null;
};


// ============================================================
// Get device belonging to user
// ============================================================
const getUserDevice = async (userId, deviceId) => {
    const sql = `
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
        WHERE id = ?
          AND user_id = ?
        LIMIT 1
    `;

    const [rows] = await db.query(
        sql,
        [deviceId, userId]
    );

    return rows[0] || null;
};


// ============================================================
// Get device using fingerprint
// ============================================================
const getDeviceByFingerprint = async (
    userId,
    fingerprint
) => {

    const sql = `
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
    `;

    const [rows] = await db.query(
        sql,
        [
            userId,
            fingerprint
        ]
    );

    return rows[0] || null;
};


// ============================================================
// Update device trust information
// ============================================================
const updateDeviceTrust = async (
    deviceId,
    userId,
    trustScore,
    status,
    browser,
    os
) => {

    const sql = `
        UPDATE devices
        SET
            trust_score = ?,
            status = ?,
            browser = ?,
            os = ?,
            last_used = NOW()
        WHERE id = ?
          AND user_id = ?
    `;

    const [result] = await db.query(
        sql,
        [
            trustScore,
            status,
            browser,
            os,
            deviceId,
            userId
        ]
    );

    return result;
};


// ============================================================
// Find applicable PBAC policy
// ============================================================
const findApplicablePolicy = async (
    roleId,
    permissionId,
    resourceName,
    deviceStatus,
    trustScore
) => {

    const sql = `
        SELECT
            sp.policy_id,
            sp.policy_name,
            sp.description,
            sp.role_id,
            r.role_name,
            sp.permission_id,
            p.permission_name,
            sp.resource_name,
            sp.required_device_status,
            sp.min_trust_score,
            sp.max_trust_score,
            sp.action
        FROM security_policies sp

        JOIN roles r
            ON sp.role_id = r.id

        JOIN permissions p
            ON sp.permission_id = p.permission_id

        WHERE sp.role_id = ?
          AND sp.permission_id = ?
          AND sp.resource_name = ?

          AND (
                sp.required_device_status = 'Any'
                OR sp.required_device_status = ?
          )

          AND ? BETWEEN
                sp.min_trust_score
                AND sp.max_trust_score

        ORDER BY
            CASE
                WHEN sp.required_device_status = ? THEN 1
                WHEN sp.required_device_status = 'Any' THEN 2
                ELSE 3
            END,

            sp.min_trust_score DESC

        LIMIT 1
    `;

    const [rows] = await db.query(
        sql,
        [
            roleId,
            permissionId,
            resourceName,
            deviceStatus,
            trustScore,
            deviceStatus
        ]
    );

    return rows[0] || null;
};


module.exports = {
    getUserById,
    getUserDevice,
    getDeviceByFingerprint,
    updateDeviceTrust,
    findApplicablePolicy
};