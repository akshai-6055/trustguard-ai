const db = require("../config/db");

// Find user by email
const findUserByEmail = (email, callback) => {
    const sql = "SELECT * FROM users WHERE email = ?";

    db.query(sql, [email], callback);
};

// Create new user
const createUser = (user, callback) => {
    const sql = `
        INSERT INTO users
        (full_name, email, password, role_id)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [user.full_name, user.email, user.password, user.role_id],
        callback
    );
};

// Find user by ID (including role_name)
const findUserById = (id, callback) => {
    const sql = `
        SELECT u.id, u.full_name, u.email, u.role_id, u.account_status, u.created_at, r.role_name
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = ?
    `;

    db.query(sql, [id], callback);
};

// Find user by email excluding current user ID (for duplicate email validation)
const findUserByEmailExcludingId = (email, userId, callback) => {
    const sql = "SELECT * FROM users WHERE email = ? AND id != ?";
    db.query(sql, [email, userId], callback);
};

// Update user profile (full_name, email)
const updateUserProfile = (id, fullName, email, callback) => {
    const sql = "UPDATE users SET full_name = ?, email = ? WHERE id = ?";
    db.query(sql, [fullName, email, id], callback);
};

// Get password by user ID
const getUserPassword = (id, callback) => {
    const sql = "SELECT password FROM users WHERE id = ?";
    db.query(sql, [id], callback);
};

// Update user password
const updateUserPassword = (id, hashedPassword, callback) => {
    const sql = "UPDATE users SET password = ? WHERE id = ?";
    db.query(sql, [hashedPassword, id], callback);
};

// Get Employee Dashboard Data
const getEmployeeDashboardData = (userId, callback) => {
    findUserById(userId, (err, userResults) => {
        if (err || !userResults || userResults.length === 0) {
            return callback(err || new Error("User not found"));
        }

        const user = userResults[0];

        // Safe query for devices count (fallback to 1 if table empty or query fails)
        db.query("SELECT COUNT(*) AS trusted_devices FROM devices WHERE user_id = ?", [userId], (devErr, devResults) => {
            const trustedDevices = (!devErr && devResults && devResults.length > 0) ? devResults[0].trusted_devices : 1;

            // Safe query for last login
            db.query("SELECT login_time, ip_address, device_info FROM login_history WHERE user_id = ? ORDER BY id DESC LIMIT 1", [userId], (logErr, logResults) => {
                const lastLogin = (!logErr && logResults && logResults.length > 0) ? logResults[0] : { login_time: new Date(), ip_address: "127.0.0.1", device_info: "Current Web Browser" };

                callback(null, {
                    user,
                    trustedDevices,
                    lastLogin,
                    currentSession: {
                        status: "Active",
                        ipAddress: "127.0.0.1",
                        startedAt: new Date()
                    },
                    accountStatus: user.account_status || "active"
                });
            });
        });
    });
};

// Get Admin Dashboard Data
const getAdminDashboardData = (callback) => {
    const totalUsersSql = "SELECT COUNT(*) AS count FROM users";
    const activeUsersSql = "SELECT COUNT(*) AS count FROM users WHERE LOWER(account_status) = 'active'";
    const blockedUsersSql = "SELECT COUNT(*) AS count FROM users WHERE LOWER(account_status) != 'active'";

    const recentUsersSql = `
        SELECT u.id, u.full_name, u.email, u.account_status, u.created_at, r.role_name
        FROM users u
        JOIN roles r ON u.role_id = r.id
        ORDER BY u.id DESC LIMIT 5
    `;
    const latestLoginActivitySql = `
        SELECT lh.id, u.full_name, u.email, lh.login_time, lh.ip_address, lh.status
        FROM login_history lh
        JOIN users u ON lh.user_id = u.id
        ORDER BY lh.id DESC LIMIT 5
    `;

    db.query(totalUsersSql, (err1, res1) => {
        const totalUsers = (!err1 && res1 && res1.length > 0) ? res1[0].count : 0;

        db.query(activeUsersSql, (err2, res2) => {
            const activeUsers = (!err2 && res2 && res2.length > 0) ? res2[0].count : 0;

            db.query(blockedUsersSql, (err3, res3) => {
                const blockedUsers = (!err3 && res3 && res3.length > 0) ? res3[0].count : 0;

                db.query(recentUsersSql, (err4, res4) => {
                    const recentRegistrations = (!err4 && res4) ? res4 : [];

                    db.query(latestLoginActivitySql, (err5, res5) => {
                        const latestLoginActivity = (!err5 && res5) ? res5 : [];

                        callback(null, {
                            totalUsers,
                            activeUsers,
                            blockedUsers,
                            recentRegistrations,
                            latestLoginActivity
                        });
                    });
                });
            });
        });
    });
};

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