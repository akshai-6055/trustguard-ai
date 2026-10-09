const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");
const deviceModel = require("../models/deviceModel");
const db = require("../config/db");

// Register User
exports.register = async (req, res) => {
    try {

        const {
            full_name,
            email,
            password,
            role_id
        } = req.body;


        // Validate
        if (!full_name || !email || !password || !role_id) {
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }

        const cleanEmail = email.trim().toLowerCase();
        const cleanFullName = full_name.trim();

        // Check existing email
        const existingUsers =
            await userModel.findUserByEmail(cleanEmail);


        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Email already exists."
            });
        }


        // Hash password
        const hashedPassword =
            await bcrypt.hash(password, 10);


        const newUser = {
            full_name: cleanFullName,
            email: cleanEmail,
            password: hashedPassword,
            role_id: Number(role_id)
        };


        // Create user
        await userModel.createUser(newUser);


        console.log("✅ User registered:", cleanEmail);


        return res.status(201).json({
            success: true,
            message: "User registered successfully."
        });

    } catch (error) {

        console.error("❌ Registration error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create user.",
            error: error.message
        });
    }
};

// Login User
exports.login = async (req, res) => {

    try {

        const {
            email,
            password,
            fingerprint,
            browser,
            os,
            device_name,
            location
        } = req.body;


        // =====================================================
        // STEP 1: VALIDATE INPUT
        // =====================================================

        if (!email || !password) {

            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        // =====================================================
        // STEP 2: FIND USER
        // =====================================================

        const results =
            await userModel.findUserByEmail(cleanEmail);

        if (!results || results.length === 0) {
            await userModel.logLoginAttempt(null, device_name, browser, "Failed", location);
            return res.status(400).json({
                success: false,
                message: "Invalid email or password."
            });
        }


        const user = results[0];


        console.log(
            "User found:",
            user.email
        );


        // =====================================================
        // STEP 3: CHECK ACCOUNT STATUS
        // =====================================================

        if (
            user.account_status &&
            user.account_status.toLowerCase() !== "active"
        ) {
            await userModel.logLoginAttempt(user.id, device_name, browser, "Blocked", location);
            return res.status(403).json({
                success: false,
                message: "Account is inactive or blocked."
            });
        }


        // =====================================================
        // STEP 4: COMPARE PASSWORD
        // =====================================================

        const isMatch =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!isMatch) {
            await userModel.logLoginAttempt(user.id, device_name, browser, "Failed", location);
            return res.status(400).json({
                success: false,
                message: "Invalid email or password."
            });
        }


        // =====================================================
        // STEP 5: GET COMPLETE USER
        // =====================================================

        const userResults =
            await userModel.findUserById(user.id);


        const fullUser =
            userResults && userResults.length > 0
                ? userResults[0]
                : user;


        // =====================================================
        // STEP 6: DEVICE RECOGNITION
        // =====================================================

        let deviceResult = null;


        if (fingerprint) {

            deviceResult =
                await deviceModel.recognizeDevice(
                    fullUser.id,
                    device_name || "Web Device",
                    browser || "Unknown Browser",
                    os || "Unknown OS",
                    fingerprint,
                    true
                );


            console.log(
                "Device recognition:",
                deviceResult
            );


            // Block login if device is blocked
            if (
                deviceResult.status === "Blocked"
            ) {
                await userModel.logLoginAttempt(fullUser.id, device_name, browser, "Blocked", location);
                return res.status(403).json({
                    success: false,
                    message:
                        "This device is blocked.",
                    device: deviceResult
                });
            }
        }


        // =====================================================
        // STEP 7: CREATE JWT
        // =====================================================

        const roleName =
            fullUser.role_name ||
            (
                fullUser.role_id === 1
                    ? "Admin"
                    : "Employee"
            );


        const [permsRows] = await db.query(
            `SELECT p.permission_name FROM role_permissions rp
             JOIN permissions p ON rp.permission_id = p.permission_id
             WHERE rp.role_id = ?`, [fullUser.role_id]
        );
        const permissions = permsRows.map(p => p.permission_name);

        const tokenPayload = {
            id: fullUser.id,
            email: fullUser.email,
            role_id: fullUser.role_id,
            role_name: roleName,
            permissions: permissions
        };


        const token =
            jwt.sign(
                tokenPayload,
                process.env.JWT_SECRET,
                {
                    expiresIn: "1d"
                }
            );


        // =====================================================
        // STEP 7.5: ANOMALY DETECTION (Impossible Travel)
        // =====================================================
        if (location && location !== 'Unknown') {
            // Get the user's most recent successful login BEFORE this one
            const [recentLogins] = await db.query(`
                SELECT location, login_time 
                FROM login_history 
                WHERE user_id = ? AND status = 'Success' 
                ORDER BY login_time DESC 
                LIMIT 1
            `, [fullUser.id]);

            if (recentLogins.length > 0) {
                const lastLogin = recentLogins[0];
                if (lastLogin.location && lastLogin.location !== 'Unknown' && lastLogin.location !== location) {
                    const timeGapHours = Math.abs(Date.now() - new Date(lastLogin.login_time).getTime()) / (1000 * 60 * 60);
                    
                    // If location changed in less than 2 hours, flag it
                    if (timeGapHours < 2) {
                        const description = `Impossible travel anomaly detected. Location changed from ${lastLogin.location} to ${location} in ${timeGapHours.toFixed(2)} hours.`;
                        
                        console.warn(`[Anomaly Detection] ${description} for user ${fullUser.id}`);

                        // Log to audit_logs (so it shows in SecurityAlerts / AuditLogs)
                        await db.query(`
                            INSERT INTO audit_logs (user_id, action, module, description, ip_address, created_at)
                            VALUES (?, ?, ?, ?, ?, NOW())
                        `, [fullUser.id, 'Anomalous Login Detected', 'Security', description, 'System']);

                        // Penalize device trust score by a heavy amount (e.g. 40 points)
                        if (deviceResult && deviceResult.deviceId) {
                            const penalty = 40;
                            await db.query(`
                                UPDATE devices 
                                SET trust_score = GREATEST(0, trust_score - ?) 
                                WHERE id = ?
                            `, [penalty, deviceResult.deviceId]);
                        }
                    }
                }
            }
        }

        // =====================================================
        // STEP 8: LOGIN RESPONSE & SESSION CREATION
        // =====================================================
        await userModel.logLoginAttempt(fullUser.id, device_name, browser, "Success", location);

        // Store the session in user_sessions table
        let deviceId = deviceResult ? deviceResult.deviceId : null;
        console.log("--- DEBUG LOGIN ---");
        console.log("Fingerprint sent by frontend:", fingerprint);
        console.log("DeviceResult:", deviceResult);
        console.log("Computed deviceId:", deviceId);
        
        if (deviceId) {
            try {
                await db.query(`
                    INSERT INTO user_sessions (user_id, device_id, jwt_token, login_time, status)
                    VALUES (?, ?, ?, NOW(), 'Active')
                `, [fullUser.id, deviceId, token]);
                console.log("Successfully inserted session into user_sessions");
            } catch (err) {
                console.error("Failed to insert session into user_sessions:", err);
            }
        } else {
            console.log("Skipped user_sessions insert because deviceId is null");
        }

        console.log("Login successful:", fullUser.email);

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            token,
            user: {

                id: fullUser.id,

                full_name: fullUser.full_name,

                email: fullUser.email,

                role_id: fullUser.role_id,

                role_name: roleName,

                permissions: permissions,

                account_status:
                    fullUser.account_status,

                created_at:
                    fullUser.created_at
            },

            device: deviceResult
        });


    } catch (error) {

        console.error(
            "Login error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Login failed due to server error.",

            error:
                error.message
        });
    }
};

// Admin Login
exports.adminLogin = async (req, res) => {
    try {
        const { email, password, fingerprint, browser, os, device_name, location } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        const results = await userModel.findUserByEmail(cleanEmail);

        if (!results || results.length === 0) {
            await userModel.logLoginAttempt(null, device_name, browser, "Failed", location);
            return res.status(400).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const user = results[0];

        if (user.account_status && user.account_status.toLowerCase() !== "active") {
            await userModel.logLoginAttempt(user.id, device_name, browser, "Blocked", location);
            return res.status(403).json({
                success: false,
                message: "Your account is currently blocked. Please contact the administrator."
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            await userModel.logLoginAttempt(user.id, device_name, browser, "Failed", location);
            return res.status(400).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const userResults = await userModel.findUserById(user.id);
        const fullUser = userResults && userResults.length > 0 ? userResults[0] : user;

        const roleName = fullUser.role_name || (fullUser.role_id === 1 ? "Admin" : "Employee");

        // Explicitly check for Admin role
        if (fullUser.role_id !== 1 && roleName.toLowerCase() !== "admin" && roleName.toLowerCase() !== "administrator") {
            await userModel.logLoginAttempt(fullUser.id, device_name, browser, "Failed", location);
            return res.status(403).json({
                success: false,
                message: "Access denied. Administrator privileges are required."
            });
        }

        let deviceResult = null;

        if (fingerprint) {
            deviceResult = await deviceModel.recognizeDevice(
                fullUser.id,
                device_name || "Web Device",
                browser || "Unknown Browser",
                os || "Unknown OS",
                fingerprint,
                true
            );

            if (deviceResult.status === "Blocked") {
                await userModel.logLoginAttempt(fullUser.id, device_name, browser, "Blocked", location);
                return res.status(403).json({
                    success: false,
                    message: "This device is blocked.",
                    device: deviceResult
                });
            }
        }

        const [permsRows] = await db.query(
            `SELECT p.permission_name FROM role_permissions rp
             JOIN permissions p ON rp.permission_id = p.permission_id
             WHERE rp.role_id = ?`, [fullUser.role_id]
        );
        const permissions = permsRows.map(p => p.permission_name);

        const tokenPayload = {
            id: fullUser.id,
            email: fullUser.email,
            role_id: fullUser.role_id,
            role_name: roleName,
            permissions: permissions
        };

        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
            expiresIn: "1d"
        });

        await userModel.logLoginAttempt(fullUser.id, device_name, browser, "Success", location);

        return res.status(200).json({
            success: true,
            message: "Admin login successful.",
            token,
            user: {
                id: fullUser.id,
                full_name: fullUser.full_name,
                email: fullUser.email,
                role_id: fullUser.role_id,
                role_name: roleName,
                permissions: permissions,
                account_status: fullUser.account_status,
                created_at: fullUser.created_at
            },
            device: deviceResult
        });
    } catch (error) {
        console.error("Admin Login error:", error);
        return res.status(500).json({
            success: false,
            message: "Login failed due to server error.",
            error: error.message
        });
    }
};
// Get User Profile (Protected Route)
exports.getProfile = async (req, res) => {
    try {

        const userId = req.user.id;

        const results =
            await userModel.findUserById(userId);

        if (!results || results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        const user = results[0];

        const [permsRows] = await db.query(
            `SELECT p.permission_name FROM role_permissions rp
             JOIN permissions p ON rp.permission_id = p.permission_id
             WHERE rp.role_id = ?`, [user.role_id]
        );
        user.permissions = permsRows.map(p => p.permission_name);

        return res.status(200).json({
            success: true,
            user: user
        });

    } catch (error) {

        console.error(
            "Get profile error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Database query error.",
            error: error.message
        });
    }
};

// Logout User
exports.logout = (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Logged out successfully."
    });
};

// ============================================================
// Verify MFA Code
// ============================================================
exports.verifyMFA = async (req, res) => {
    try {
        const { code } = req.body;
        const userId = req.user.id;

        const authHeader = req.headers["authorization"];
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, message: "No token provided." });
        }
        const token = authHeader.split(" ")[1];

        const [sessions] = await db.query(`
            SELECT * FROM user_sessions 
            WHERE jwt_token = ? AND status = 'Active'
        `, [token]);

        if (sessions.length === 0) {
            return res.status(401).json({ success: false, message: "Session is expired or invalid." });
        }
        const activeSession = sessions[0];

        const { verifyOTP } = require('../services/mfaService');
        const isValid = verifyOTP(activeSession.session_id, code);

        if (isValid) {
            // Boost device trust score slightly since they passed MFA to suppress immediate re-trigger
            await db.query(`
                UPDATE devices 
                SET trust_score = LEAST(100, trust_score + 10) 
                WHERE id = ?
            `, [activeSession.device_id]);

            await db.query(`
                INSERT INTO audit_logs (user_id, action, module, description, ip_address, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())
            `, [userId, 'MFA Verification Success', 'Security', `User successfully verified MFA code for session ${activeSession.session_id}.`, req.ip]);

            return res.status(200).json({ success: true, message: "MFA Verification successful." });
        } else {
            await db.query(`
                INSERT INTO audit_logs (user_id, action, module, description, ip_address, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())
            `, [userId, 'MFA Verification Failed', 'Security', `User failed MFA verification for session ${activeSession.session_id}.`, req.ip]);

            return res.status(401).json({ success: false, message: "Invalid or expired MFA code." });
        }
    } catch (error) {
        console.error("MFA Verification error:", error);
        return res.status(500).json({ success: false, message: "Failed to verify MFA." });
    }
};