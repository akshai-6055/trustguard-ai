const db = require("../config/db");

// ============================================================
// Find user by email
// ============================================================
const findUserByEmail = async (email) => {
    const cleanEmail = email ? email.trim().toLowerCase() : "";
    const sql = "SELECT * FROM users WHERE LOWER(TRIM(email)) = ?";

    console.log("🔍 Searching user by email:", cleanEmail);

    const [rows] = await db.query(sql, [cleanEmail]);

    console.log("✅ User query completed. Found:", rows.length);

    return rows;
};


// ============================================================
// Create new user
// ============================================================
const createUser = async (user) => {
    const sql = `
        INSERT INTO users
        (full_name, email, password, role_id)
        VALUES (?, ?, ?, ?)
    `;

    const cleanFullName = user.full_name ? user.full_name.trim() : "";
    const cleanEmail = user.email ? user.email.trim().toLowerCase() : "";

    const [result] = await db.query(
        sql,
        [
            cleanFullName,
            cleanEmail,
            user.password,
            user.role_id
        ]
    );

    return result;
};


// ============================================================
// Find user by ID including role name
// ============================================================
const findUserById = async (id) => {
    const sql = `
        SELECT 
            u.id,
            u.full_name,
            u.email,
            u.role_id,
            u.account_status,
            u.created_at,
            r.role_name
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = ?
    `;

    const [rows] = await db.query(sql, [id]);

    return rows;
};


// ============================================================
// Find user by email excluding current user ID
// ============================================================
const findUserByEmailExcludingId = async (email, userId) => {
    const cleanEmail = email ? email.trim().toLowerCase() : "";
    const sql = `
        SELECT *
        FROM users
        WHERE LOWER(TRIM(email)) = ?
        AND id != ?
    `;

    const [rows] = await db.query(
        sql,
        [cleanEmail, userId]
    );

    return rows;
};


// ============================================================
// Update user profile
// ============================================================
const updateUserProfile = async (id, fullName, email) => {
    const cleanFullName = fullName ? fullName.trim() : "";
    const cleanEmail = email ? email.trim().toLowerCase() : "";
    const sql = `
        UPDATE users
        SET full_name = ?, email = ?
        WHERE id = ?
    `;

    const [result] = await db.query(
        sql,
        [cleanFullName, cleanEmail, id]
    );

    return result;
};


// ============================================================
// Get password by user ID
// ============================================================
const getUserPassword = async (id) => {
    const sql = `
        SELECT password
        FROM users
        WHERE id = ?
    `;

    const [rows] = await db.query(sql, [id]);

    return rows;
};


// ============================================================
// Update user password
// ============================================================
const updateUserPassword = async (id, hashedPassword) => {
    const sql = `
        UPDATE users
        SET password = ?
        WHERE id = ?
    `;

    const [result] = await db.query(
        sql,
        [hashedPassword, id]
    );

    return result;
};


// ============================================================
// Get Employee Dashboard Data
// ============================================================
const getEmployeeDashboardData = async (userId) => {

    // --------------------------------------------------------
    // Get user information
    // --------------------------------------------------------
    const userResults = await findUserById(userId);

    if (!userResults || userResults.length === 0) {
        throw new Error("User not found");
    }

    const user = userResults[0];


    // --------------------------------------------------------
    // Get trusted device count
    // --------------------------------------------------------
    const [devResults] = await db.query(
        `
        SELECT COUNT(*) AS trusted_devices
        FROM devices
        WHERE user_id = ?
        `,
        [userId]
    );

    const trustedDevices =
        devResults.length > 0
            ? devResults[0].trusted_devices
            : 0;


    // --------------------------------------------------------
    // Get latest login information
    //
    // login_history table columns:
    // id
    // user_id
    // device_name
    // browser
    // location
    // login_time
    // status
    // --------------------------------------------------------
    const [logResults] = await db.query(
        `
        SELECT
            login_time,
            device_name,
            browser,
            location,
            status
        FROM login_history
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT 5
        `,
        [userId]
    );


    // --------------------------------------------------------
    // If no login history exists, use fallback information
    // --------------------------------------------------------
    const lastLogin =
        logResults.length > 0
            ? logResults[0]
            : {
                login_time: new Date(),
                device_name: "Current Device",
                browser: "Current Browser",
                location: "Unknown",
                status: "Success"
            };

    const recentActivity = logResults;


    // --------------------------------------------------------
    // Return dashboard data
    // --------------------------------------------------------
    return {
        user,
        trustedDevices,
        lastLogin,
        recentActivity,

        currentSession: {
            status: "Active",
            ipAddress: "127.0.0.1",
            startedAt: new Date()
        },

        accountStatus: user.account_status || "Active"
    };
};


// ============================================================
// Get Admin Dashboard Data
// ============================================================
const getAdminDashboardData = async () => {

    // --------------------------------------------------------
    // Total users
    // --------------------------------------------------------
    const [totalUsersResult] = await db.query(
        `
        SELECT COUNT(*) AS count
        FROM users
        `
    );


    // --------------------------------------------------------
    // Active users
    // --------------------------------------------------------
    const [activeUsersResult] = await db.query(
        `
        SELECT COUNT(*) AS count
        FROM users
        WHERE LOWER(account_status) = 'active'
        `
    );


    // --------------------------------------------------------
    // Blocked / inactive users
    // --------------------------------------------------------
    const [blockedUsersResult] = await db.query(
        `
        SELECT COUNT(*) AS count
        FROM users
        WHERE LOWER(account_status) != 'active'
        `
    );


    // --------------------------------------------------------
    // Recent registered users
    // --------------------------------------------------------
    const recentUsersSql = `
        SELECT
            u.id,
            u.full_name,
            u.email,
            u.account_status,
            u.created_at,
            r.role_name
        FROM users u
        JOIN roles r ON u.role_id = r.id
        ORDER BY u.id DESC
        LIMIT 5
    `;


    // --------------------------------------------------------
    // Latest login activity
    //
    // Uses the ACTUAL login_history table columns.
    // --------------------------------------------------------
    const latestLoginActivitySql = `
        SELECT
            lh.id,
            u.full_name,
            u.email,
            lh.login_time,
            lh.device_name,
            lh.browser,
            lh.location,
            lh.status
        FROM login_history lh
        LEFT JOIN users u
            ON lh.user_id = u.id
        ORDER BY lh.id DESC
        LIMIT 5
    `;


    // --------------------------------------------------------
    // Execute recent users query
    // --------------------------------------------------------
    const [recentUsers] = await db.query(
        recentUsersSql
    );


    // --------------------------------------------------------
    // Execute latest login activity query
    // --------------------------------------------------------
    const [latestLoginActivity] = await db.query(
        latestLoginActivitySql
    );

    // --------------------------------------------------------
    // Devices metrics
    // --------------------------------------------------------
    const [totalDevicesResult] = await db.query(
        `SELECT COUNT(*) AS count FROM devices`
    );

    const [trustedDevicesResult] = await db.query(
        `SELECT COUNT(*) AS count FROM devices WHERE status = 'Trusted'`
    );

    const [untrustedDevicesResult] = await db.query(
        `SELECT COUNT(*) AS count FROM devices WHERE status != 'Trusted'`
    );

    // --------------------------------------------------------
    // Login metrics
    // --------------------------------------------------------
    const [failedLoginsResult] = await db.query(
        `SELECT COUNT(*) AS count FROM login_history WHERE status != 'Success'`
    );

    // Mock active sessions as we don't have a sessions table
    const activeSessions = Math.max(0, Math.floor(activeUsersResult[0].count * 0.75));

    // --------------------------------------------------------
    // Return admin dashboard data
    // --------------------------------------------------------
    return {
        totalUsers: totalUsersResult[0].count,
        activeUsers: activeUsersResult[0].count,
        blockedUsers: blockedUsersResult[0].count,
        
        totalDevices: totalDevicesResult[0].count,
        trustedDevices: trustedDevicesResult[0].count,
        untrustedDevices: untrustedDevicesResult[0].count,
        
        failedLogins: failedLoginsResult[0].count,
        activeSessions,

        recentRegistrations: recentUsers,

        latestLoginActivity
    };
};


// ============================================================
// Get all users (Admin)
// ============================================================
const getAllUsers = async () => {
    const sql = `
        SELECT 
            u.id,
            u.full_name,
            u.email,
            u.role_id,
            u.account_status,
            u.created_at,
            r.role_name
        FROM users u
        JOIN roles r ON u.role_id = r.id
        ORDER BY u.id DESC
    `;
    const [rows] = await db.query(sql);
    return rows;
};

// ============================================================
// Update user status (Admin)
// ============================================================
const updateUserStatus = async (userId, status) => {
    const sql = `
        UPDATE users
        SET account_status = ?
        WHERE id = ?
    `;
    const [result] = await db.query(sql, [status, userId]);
    return result;
};

// ============================================================
// Update user details (Admin)
// ============================================================
const updateUserAdmin = async (userId, user) => {
    const cleanFullName = user.full_name ? user.full_name.trim() : "";
    const cleanEmail = user.email ? user.email.trim().toLowerCase() : "";
    
    let sql = `
        UPDATE users
        SET full_name = ?, email = ?, role_id = ?, account_status = ?
    `;
    const params = [cleanFullName, cleanEmail, user.role_id, user.account_status];
    
    if (user.password) {
        sql += `, password = ?`;
        params.push(user.password);
    }
    
    sql += ` WHERE id = ?`;
    params.push(userId);
    
    const [result] = await db.query(sql, params);
    return result;
};

// ============================================================
// Delete user (Admin)
// ============================================================
const deleteUser = async (userId) => {
    const sql = `
        DELETE FROM users
        WHERE id = ?
    `;
    const [result] = await db.query(sql, [userId]);
    return result;
};

// ============================================================
// Log login attempt
// ============================================================
const logLoginAttempt = async (userId, deviceName, browser, status, location = 'Unknown') => {
    const sql = `
        INSERT INTO login_history (user_id, device_name, browser, location, login_time, status)
        VALUES (?, ?, ?, ?, NOW(), ?)
    `;
    const [result] = await db.query(sql, [userId || null, deviceName || 'Unknown Device', browser || 'Unknown Browser', location || 'Unknown', status]);
    return result;
};

// ============================================================
// Export all functions
// ============================================================
module.exports = {
    findUserByEmail,
    createUser,
    findUserById,
    findUserByEmailExcludingId,
    updateUserProfile,
    getUserPassword,
    updateUserPassword,
    getEmployeeDashboardData,
    getAdminDashboardData,
    getAllUsers,
    updateUserStatus,
    updateUserAdmin,
    deleteUser,
    logLoginAttempt
};