const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");
const deviceModel = require("../models/deviceModel");

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


        // Check existing email
        const existingUsers =
            await userModel.findUserByEmail(email);


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
            full_name,
            email,
            password: hashedPassword,
            role_id
        };


        // Create user
        await userModel.createUser(newUser);


        console.log("✅ User registered:", email);


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
            device_name
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


        // =====================================================
        // STEP 2: FIND USER
        // =====================================================

        const results =
            await userModel.findUserByEmail(email);


        if (!results || results.length === 0) {

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


        const tokenPayload = {

            id: fullUser.id,

            email: fullUser.email,

            role_id: fullUser.role_id,

            role_name: roleName
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
        // STEP 8: LOGIN RESPONSE
        // =====================================================

        console.log(
            "Login successful:",
            fullUser.email
        );


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

        return res.status(200).json({
            success: true,
            user: results[0]
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