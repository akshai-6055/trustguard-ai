const bcrypt = require("bcrypt");
const userModel = require("../models/userModel");


// ============================================================
// Get User Profile
// ============================================================
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

        console.error("Get profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Database query error.",
            error: error.message
        });
    }
};


// ============================================================
// Update User Profile
// ============================================================
exports.updateProfile = async (req, res) => {
    try {

        const userId = req.user.id;

        const {
            full_name,
            email
        } = req.body;


        // Required fields
        if (!full_name || !email) {
            return res.status(400).json({
                success: false,
                message: "Full Name and Email are required fields."
            });
        }


        // Email format validation
        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });
        }


        // Check duplicate email
        const existingUsers =
            await userModel.findUserByEmailExcludingId(
                email.trim(),
                userId
            );


        if (
            existingUsers &&
            existingUsers.length > 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Email already exists."
            });
        }


        // Update profile
        await userModel.updateUserProfile(
            userId,
            full_name.trim(),
            email.trim()
        );


        // Get updated user
        const updatedUserResults =
            await userModel.findUserById(userId);


        const updatedUser =
            updatedUserResults &&
            updatedUserResults.length > 0
                ? updatedUserResults[0]
                : null;


        return res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            user: updatedUser
        });

    } catch (error) {

        console.error(
            "Update profile error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to update profile.",
            error: error.message
        });
    }
};


// ============================================================
// Change Password
// ============================================================
exports.changePassword = async (req, res) => {

    try {

        const userId = req.user.id;

        const {
            currentPassword,
            newPassword,
            confirmPassword
        } = req.body;


        // Required fields
        if (
            !currentPassword ||
            !newPassword ||
            !confirmPassword
        ) {
            return res.status(400).json({
                success: false,
                message: "All password fields are required."
            });
        }


        // Minimum password length
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message:
                    "New password must be at least 8 characters long."
            });
        }


        // Password confirmation
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message:
                    "New password and confirm password do not match."
            });
        }


        // Get current password
        const results =
            await userModel.getUserPassword(userId);


        if (!results || results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }


        const storedPassword =
            results[0].password;


        // Compare password
        const isMatch =
            await bcrypt.compare(
                currentPassword,
                storedPassword
            );


        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid current password."
            });
        }


        // Hash new password
        const hashedNewPassword =
            await bcrypt.hash(newPassword, 10);


        // Update password
        await userModel.updateUserPassword(
            userId,
            hashedNewPassword
        );


        return res.status(200).json({
            success: true,
            message:
                "Password changed successfully."
        });

    } catch (error) {

        console.error(
            "Change password error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ============================================================
// Get Employee Dashboard
// ============================================================
exports.getDashboard = async (req, res) => {

    try {

        const userId = req.user.id;

        console.log(
            "📊 Loading dashboard for user:",
            userId
        );


        const dashboardData =
            await userModel.getEmployeeDashboardData(
                userId
            );


        if (!dashboardData) {
            return res.status(404).json({
                success: false,
                message: "Dashboard data not found."
            });
        }


        console.log(
            "✅ Dashboard data loaded for user:",
            userId
        );


        return res.status(200).json({
            success: true,
            dashboard: dashboardData
        });

    } catch (error) {

        console.error(
            "❌ Dashboard error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to retrieve dashboard data.",
            error: error.message
        });
    }
};