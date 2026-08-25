const db = require("../config/db");

// ============================================================
// Get all security policies
// ============================================================
const getAllPolicies = async () => {
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
            sp.action,
            sp.created_at
        FROM security_policies sp
        JOIN roles r
            ON sp.role_id = r.id
        JOIN permissions p
            ON sp.permission_id = p.permission_id
        ORDER BY sp.policy_id DESC
    `;

    const [rows] = await db.query(sql);

    return rows;
};


// ============================================================
// Get policy by ID
// ============================================================
const getPolicyById = async (policyId) => {
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
            sp.action,
            sp.created_at
        FROM security_policies sp
        JOIN roles r
            ON sp.role_id = r.id
        JOIN permissions p
            ON sp.permission_id = p.permission_id
        WHERE sp.policy_id = ?
    `;

    const [rows] = await db.query(sql, [policyId]);

    return rows;
};


// ============================================================
// Find applicable policy
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
            sp.permission_id,
            sp.resource_name,
            sp.required_device_status,
            sp.min_trust_score,
            sp.max_trust_score,
            sp.action
        FROM security_policies sp
        WHERE sp.role_id = ?
          AND sp.permission_id = ?
          AND sp.resource_name = ?
          AND (
                sp.required_device_status = 'Any'
                OR sp.required_device_status = ?
          )
          AND ? BETWEEN sp.min_trust_score
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

    return rows;
};


// ============================================================
// Create security policy
// ============================================================
const createPolicy = async (policy) => {

    const sql = `
        INSERT INTO security_policies
        (
            policy_name,
            description,
            role_id,
            permission_id,
            resource_name,
            required_device_status,
            min_trust_score,
            max_trust_score,
            action
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(
        sql,
        [
            policy.policy_name,
            policy.description,
            policy.role_id,
            policy.permission_id,
            policy.resource_name,
            policy.required_device_status,
            policy.min_trust_score,
            policy.max_trust_score,
            policy.action
        ]
    );

    return result;
};


// ============================================================
// Update security policy
// ============================================================
const updatePolicy = async (policyId, policy) => {

    const sql = `
        UPDATE security_policies
        SET
            policy_name = ?,
            description = ?,
            role_id = ?,
            permission_id = ?,
            resource_name = ?,
            required_device_status = ?,
            min_trust_score = ?,
            max_trust_score = ?,
            action = ?
        WHERE policy_id = ?
    `;

    const [result] = await db.query(
        sql,
        [
            policy.policy_name,
            policy.description,
            policy.role_id,
            policy.permission_id,
            policy.resource_name,
            policy.required_device_status,
            policy.min_trust_score,
            policy.max_trust_score,
            policy.action,
            policyId
        ]
    );

    return result;
};


// ============================================================
// Delete security policy
// ============================================================
const deletePolicy = async (policyId) => {

    const sql = `
        DELETE FROM security_policies
        WHERE policy_id = ?
    `;

    const [result] = await db.query(sql, [policyId]);

    return result;
};


// ============================================================
// Export
// ============================================================
module.exports = {
    getAllPolicies,
    getPolicyById,
    findApplicablePolicy,
    createPolicy,
    updatePolicy,
    deletePolicy
};