const db = require("../config/db");

// ============================================================
// Find user by email
// ============================================================
const findUserByEmail = async (email) => {
    const sql = "SELECT * FROM users WHERE email = ?";

    console.log("🔍 Searching user by email:", email);

    const [rows] = await db.query(sql, [email]);

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

    const [result] = await db.query(
        sql,
        [
            user.full_name,
            user.email,
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
    const sql = `
        SELECT *
        FROM users
        WHERE email = ?
        AND id != ?
    `;

    const [rows] = await db.query(
        sql,
        [email, userId]
    );

    return rows;
};


// ============================================================
// Update user profile
// ============================================================
const updateUserProfile = async (id, fullName, email) => {
    const sql = `
        UPDATE users
        SET full_name = ?, email = ?
        WHERE id = ?
    `;

    const [result] = await db.query(
        sql,
        [fullName, email, id]
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
        LIMIT 1
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


    // --------------------------------------------------------
    // Return dashboard data
    // --------------------------------------------------------
    return {
        user,
        trustedDevices,
        lastLogin,

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
        JOIN users u
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
    // Return admin dashboard data
    // --------------------------------------------------------
    return {
        totalUsers: totalUsersResult[0].count,
        activeUsers: activeUsersResult[0].count,
        blockedUsers: blockedUsersResult[0].count,

        recentRegistrations: recentUsers,

        latestLoginActivity
    };
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
    getAdminDashboardData
};