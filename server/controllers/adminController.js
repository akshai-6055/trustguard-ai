const userModel = require("../models/userModel");

// Get Admin Dashboard Data
exports.getDashboard = (req, res) => {
    userModel.getAdminDashboardData((err, dashboardData) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Failed to retrieve admin dashboard data.",
                error: err.message
            });
        }

        return res.status(200).json({
            success: true,
            dashboard: dashboardData
        });
    });
};
