const bcrypt = require("bcrypt");
const userModel = require("../models/userModel");

// Get User Profile
exports.getProfile = (req, res) => {
    const userId = req.user.id;

    userModel.findUserById(userId, (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Database query error.", error: err });
        }

        if (!results || results.length === 0) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        return res.status(200).json({
            success: true,
            user: results[0]
        });
    });
};

// Update User Profile (Full Name, Email)
exports.updateProfile = (req, res) => {
    const userId = req.user.id;
    const { full_name, email } = req.body;

    // 1. Required fields validation
    if (!full_name || !email) {
        return res.status(400).json({
            success: false,
            message: "Full Name and Email are required fields."
        });
    }

    // 2. Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: "Please enter a valid email address."
        });
    }

    // 3. Unique email validation
    userModel.findUserByEmailExcludingId(email, userId, (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Database query error.", error: err });
        }

        if (results && results.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Email already exists."
            });
        }

        // 4. Update Profile
        userModel.updateUserProfile(userId, full_name.trim(), email.trim(), (updateErr, result) => {
            if (updateErr) {
                return res.status(500).json({ success: false, message: "Failed to update profile.", error: updateErr });
            }

            // Fetch updated user data
            userModel.findUserById(userId, (fetchErr, updatedUserResults) => {
                const updatedUser = (updatedUserResults && updatedUserResults.length > 0) ? updatedUserResults[0] : null;

                return res.status(200).json({
                    success: true,
                    message: "Profile updated successfully.",
                    user: updatedUser
                });
            });
        });
    });
};

// Change Password
exports.changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword, confirmPassword } = req.body;

        // 1. Required fields
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All password fields are required."
            });
        }

        // 2. Minimum 8 characters check
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 8 characters long."
            });
        }

        // 3. Passwords match check
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "New password and confirm password do not match."
            });
        }

        // 4. Verify Current Password
        userModel.getUserPassword(userId, async (err, results) => {
            if (err) {
                return res.status(500).json({ success: false, message: "Database query error.", error: err });
            }

            if (!results || results.length === 0) {
                return res.status(404).json({ success: false, message: "User not found." });
            }

            const storedPassword = results[0].password;
            const isMatch = await bcrypt.compare(currentPassword, storedPassword);

            if (!isMatch) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid current password."
                });
            }

            // 5. Hash new password
            const hashedNewPassword = await bcrypt.hash(newPassword, 10);

            // 6. Update Database
            userModel.updateUserPassword(userId, hashedNewPassword, (updateErr, result) => {
                if (updateErr) {
                    return res.status(500).json({ success: false, message: "Failed to update password.", error: updateErr });
                }

                return res.status(200).json({
                    success: true,
                    message: "Password changed successfully."
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

// Get Employee Dashboard Data
exports.getDashboard = (req, res) => {
    const userId = req.user.id;

    userModel.getEmployeeDashboardData(userId, (err, dashboardData) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Failed to retrieve dashboard data.",
                error: err.message
            });
        }

        return res.status(200).json({
            success: true,
            dashboard: dashboardData
        });
    });
};
