const policyModel = require("../models/policyModel");

// ============================================================
// Get all policies
// ============================================================
exports.getAllPolicies = async (req, res) => {

    try {

        const policies =
            await policyModel.getAllPolicies();

        return res.status(200).json({
            success: true,
            policies
        });

    } catch (error) {

        console.error(
            "Get policies error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve security policies.",
            error: error.message
        });
    }
};


// ============================================================
// Get policy by ID
// ============================================================
exports.getPolicyById = async (req, res) => {

    try {

        const { id } = req.params;

        const policies =
            await policyModel.getPolicyById(id);

        if (!policies || policies.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Security policy not found."
            });
        }

        return res.status(200).json({
            success: true,
            policy: policies[0]
        });

    } catch (error) {

        console.error(
            "Get policy error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve security policy.",
            error: error.message
        });
    }
};


// ============================================================
// Create policy
// ============================================================
exports.createPolicy = async (req, res) => {

    try {

        const {
            policy_name,
            description,
            role_id,
            permission_id,
            resource_name,
            required_device_status,
            min_trust_score,
            max_trust_score,
            action
        } = req.body;


        if (
            !policy_name ||
            !role_id ||
            !permission_id ||
            !resource_name ||
            !required_device_status ||
            min_trust_score === undefined ||
            max_trust_score === undefined ||
            !action
        ) {

            return res.status(400).json({
                success: false,
                message: "All required policy fields must be provided."
            });
        }


        if (
            min_trust_score < 0 ||
            max_trust_score > 100 ||
            min_trust_score > max_trust_score
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid trust score range."
            });
        }


        const policy = {
            policy_name,
            description,
            role_id,
            permission_id,
            resource_name,
            required_device_status,
            min_trust_score,
            max_trust_score,
            action
        };


        const result =
            await policyModel.createPolicy(policy);


        return res.status(201).json({
            success: true,
            message: "Security policy created successfully.",
            policy_id: result.insertId
        });

    } catch (error) {

        console.error(
            "Create policy error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to create security policy.",
            error: error.message
        });
    }
};


// ============================================================
// Update policy
// ============================================================
exports.updatePolicy = async (req, res) => {

    try {

        const { id } = req.params;

        const {
            policy_name,
            description,
            role_id,
            permission_id,
            resource_name,
            required_device_status,
            min_trust_score,
            max_trust_score,
            action
        } = req.body;


        if (
            !policy_name ||
            !role_id ||
            !permission_id ||
            !resource_name ||
            !required_device_status ||
            min_trust_score === undefined ||
            max_trust_score === undefined ||
            !action
        ) {

            return res.status(400).json({
                success: false,
                message: "All required policy fields must be provided."
            });
        }


        if (
            min_trust_score < 0 ||
            max_trust_score > 100 ||
            min_trust_score > max_trust_score
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid trust score range."
            });
        }


        const policy = {
            policy_name,
            description,
            role_id,
            permission_id,
            resource_name,
            required_device_status,
            min_trust_score,
            max_trust_score,
            action
        };


        const result =
            await policyModel.updatePolicy(
                id,
                policy
            );


        if (result.affectedRows === 0) {

            return res.status(404).json({
                success: false,
                message: "Security policy not found."
            });
        }


        return res.status(200).json({
            success: true,
            message: "Security policy updated successfully."
        });

    } catch (error) {

        console.error(
            "Update policy error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to update security policy.",
            error: error.message
        });
    }
};


// ============================================================
// Delete policy
// ============================================================
exports.deletePolicy = async (req, res) => {

    try {

        const { id } = req.params;

        const result =
            await policyModel.deletePolicy(id);


        if (result.affectedRows === 0) {

            return res.status(404).json({
                success: false,
                message: "Security policy not found."
            });
        }


        return res.status(200).json({
            success: true,
            message: "Security policy deleted successfully."
        });

    } catch (error) {

        console.error(
            "Delete policy error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to delete security policy.",
            error: error.message
        });
    }
};