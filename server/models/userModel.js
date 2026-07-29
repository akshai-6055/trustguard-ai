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

module.exports = {
    findUserByEmail,
    createUser,
    findUserById
};