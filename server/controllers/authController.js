const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

// Register User
exports.register = async (req, res) => {
    try {
        const { full_name, email, password, role_id } = req.body;

        // Step 1: Validate Input
        if (!full_name || !email || !password || !role_id) {
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }

        // Step 2: Check if Email Already Exists
        userModel.findUserByEmail(email, async (err, results) => {
            if (err) {
                return res.status(500).json({ success: false, message: "Database query error.", error: err });
            }

            if (results.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: "Email already exists."
                });
            }

            // Step 3: Hash Password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Step 4: Create User Object
            const newUser = {
                full_name,
                email,
                password: hashedPassword,
                role_id
            };

            // Step 5: Save User
            userModel.createUser(newUser, (err, result) => {
                if (err) {
                    return res.status(500).json({ success: false, message: "Failed to create user.", error: err });
                }

                return res.status(201).json({
                    success: true,
                    message: "User registered successfully."
                });
            });
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Login User
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Step 1: Validate Input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        // Step 2: Find User by Email
        userModel.findUserByEmail(email, async (err, results) => {
            if (err) {
                return res.status(500).json({ success: false, message: "Database query error.", error: err });
            }

            if (results.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid email or password."
                });
            }

            const user = results[0];

            // Step 3: Check Account Status
            if (user.account_status !== "active") {
                return res.status(403).json({
                    success: false,
                    message: "Account is inactive or suspended."
                });
            }

            // Step 4: Compare Password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid email or password."
                });
            }

            // Step 5: Generate JWT Token
            const tokenPayload = {
                id: user.id,
                email: user.email,
                role_id: user.role_id
            };

            const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
                expiresIn: "1d"
            });

            // Step 6: Return Response with Token
            return res.status(200).json({
                success: true,
                message: "Login successful.",
                token,
                user: {
                    id: user.id,
                    full_name: user.full_name,
                    email: user.email,
                    role_id: user.role_id
                }
            });
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get User Profile (Protected Route)
exports.getProfile = (req, res) => {
    const userId = req.user.id;

    userModel.findUserById(userId, (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Database query error.", error: err });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        return res.status(200).json({
            success: true,
            user: results[0]
        });
    });
};