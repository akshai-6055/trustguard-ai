const continuousAuthModel = require("../models/continuousAuthModel");


// ============================================================
// CONTINUOUS AUTHENTICATION
// ============================================================
exports.evaluateAccess = async (req, res) => {

    try {

        // ----------------------------------------------------
        // 1. Get authenticated user
        // ----------------------------------------------------

        const userId = req.user.id;

        const {
            device_id,
            fingerprint,
            browser,
            os,
            permission_id,
            resource_name
        } = req.body;


        // ----------------------------------------------------
        // 2. Validate request
        // ----------------------------------------------------

        if (
            !device_id &&
            !fingerprint
        ) {

            return res.status(400).json({
                success: false,
                message: "Device ID or fingerprint is required."
            });
        }


        if (
            !permission_id ||
            !resource_name
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Permission ID and resource name are required."
            });
        }


        // ----------------------------------------------------
        // 3. Get user
        // ----------------------------------------------------

        const user =
            await continuousAuthModel.getUserById(
                userId
            );


        if (!user) {

            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }


        // ----------------------------------------------------
        // 4. Check account status
        // ----------------------------------------------------

        if (
            !user.account_status ||
            user.account_status.toLowerCase() !== "active"
        ) {

            return res.status(403).json({

                success: false,

                decision: "DENY",

                reason:
                    "User account is inactive or blocked."
            });
        }


        // ----------------------------------------------------
        // 5. Identify device
        // ----------------------------------------------------

        let device = null;


        if (device_id) {

            device =
                await continuousAuthModel.getUserDevice(
                    userId,
                    device_id
                );

        }


        // If device ID did not identify device,
        // try fingerprint.

        if (
            !device &&
            fingerprint
        ) {

            device =
                await continuousAuthModel
                    .getDeviceByFingerprint(
                        userId,
                        fingerprint
                    );

        }


        // ----------------------------------------------------
        // 6. Device must exist
        // ----------------------------------------------------

        if (!device) {

            return res.status(403).json({

                success: false,

                decision: "DENY",

                reason:
                    "Device is not registered."
            });
        }


        // ----------------------------------------------------
        // 7. Check manually blocked device
        // ----------------------------------------------------

        if (
            device.status &&
            device.status.toLowerCase() === "blocked"
        ) {

            return res.status(403).json({

                success: false,

                decision: "DENY",

                reason:
                    "Device is blocked.",

                device: {
                    device_id: device.id,
                    trust_score: device.trust_score,
                    status: device.status
                }
            });
        }


        // ----------------------------------------------------
        // 8. Calculate current trust score
        // ----------------------------------------------------

        const fingerprintMatch =
            fingerprint &&
            device.fingerprint === fingerprint;


        const browserMatch =
            browser &&
            device.browser === browser;


        const osMatch =
            os &&
            device.os === os;


        const recentlyUsed =
            device.last_used &&
            (
                Date.now() -
                new Date(device.last_used).getTime()
            ) <=
            30 * 24 * 60 * 60 * 1000;


        let trustScore = 0;


        if (fingerprintMatch) {
            trustScore += 50;
        }


        if (browserMatch) {
            trustScore += 20;
        }


        if (osMatch) {
            trustScore += 15;
        }


        if (recentlyUsed) {
            trustScore += 5;
        }


        if (
            user.account_status &&
            user.account_status.toLowerCase() === "active"
        ) {
            trustScore += 10;
        }


        trustScore =
            Math.min(
                trustScore,
                100
            );


        // ----------------------------------------------------
        // 9. Determine current device status
        // ----------------------------------------------------

        let deviceStatus;


        if (trustScore >= 80) {

            deviceStatus = "Trusted";

        } else if (trustScore >= 50) {

            deviceStatus = "Pending";

        } else {

            deviceStatus = "Blocked";
        }


        // ----------------------------------------------------
        // 10. Never automatically unblock manually blocked device
        // ----------------------------------------------------

        if (
            device.status.toLowerCase() === "blocked"
        ) {

            deviceStatus = "Blocked";
        }


        // ----------------------------------------------------
        // 11. Update device trust information
        // ----------------------------------------------------

        await continuousAuthModel.updateDeviceTrust(

            device.id,

            userId,

            trustScore,

            deviceStatus,

            browser || device.browser,

            os || device.os
        );


        // ----------------------------------------------------
        // 12. Block low-trust device
        // ----------------------------------------------------

        if (
            deviceStatus === "Blocked"
        ) {

            return res.status(403).json({

                success: false,

                decision: "DENY",

                reason:
                    "Device trust score is too low.",

                user: {
                    id: user.id,
                    role_id: user.role_id,
                    role_name: user.role_name
                },

                device: {
                    device_id: device.id,
                    trust_score: trustScore,
                    status: deviceStatus
                }
            });
        }


        // ----------------------------------------------------
        // 13. Find applicable PBAC policy
        // ----------------------------------------------------

        const policy =
            await continuousAuthModel.findApplicablePolicy(

                user.role_id,

                permission_id,

                resource_name,

                deviceStatus,

                trustScore
            );


        // ----------------------------------------------------
        // 14. No matching policy
        // ----------------------------------------------------

        if (!policy) {

            return res.status(403).json({

                success: false,

                decision: "DENY",

                reason:
                    "No applicable security policy found.",

                user: {
                    id: user.id,
                    role_id: user.role_id,
                    role_name: user.role_name
                },

                device: {
                    device_id: device.id,
                    trust_score: trustScore,
                    status: deviceStatus
                }
            });
        }


        // ----------------------------------------------------
        // 15. Evaluate policy action
        // ----------------------------------------------------

        const action =
            policy.action.toUpperCase();


        // ----------------------------------------------------
        // ALLOW
        // ----------------------------------------------------

        if (action === "ALLOW") {

            return res.status(200).json({

                success: true,

                decision: "ALLOW",

                reason:
                    "Access granted by security policy.",

                user: {
                    id: user.id,
                    role_id: user.role_id,
                    role_name: user.role_name
                },

                device: {
                    device_id: device.id,
                    trust_score: trustScore,
                    status: deviceStatus
                },

                policy: {
                    policy_id: policy.policy_id,
                    policy_name: policy.policy_name,
                    permission_name:
                        policy.permission_name,
                    resource_name:
                        policy.resource_name,
                    action: policy.action
                }
            });
        }


        // ----------------------------------------------------
        // MFA
        // ----------------------------------------------------

        if (action === "MFA") {

            return res.status(200).json({

                success: true,

                decision: "MFA",

                reason:
                    "Additional authentication is required.",

                user: {
                    id: user.id,
                    role_id: user.role_id,
                    role_name: user.role_name
                },

                device: {
                    device_id: device.id,
                    trust_score: trustScore,
                    status: deviceStatus
                },

                policy: {
                    policy_id: policy.policy_id,
                    policy_name: policy.policy_name,
                    permission_name:
                        policy.permission_name,
                    resource_name:
                        policy.resource_name,
                    action: policy.action
                }
            });
        }


        // ----------------------------------------------------
        // DENY
        // ----------------------------------------------------

        if (action === "DENY") {

            return res.status(403).json({

                success: false,

                decision: "DENY",

                reason:
                    "Access denied by security policy.",

                user: {
                    id: user.id,
                    role_id: user.role_id,
                    role_name: user.role_name
                },

                device: {
                    device_id: device.id,
                    trust_score: trustScore,
                    status: deviceStatus
                },

                policy: {
                    policy_id: policy.policy_id,
                    policy_name: policy.policy_name,
                    permission_name:
                        policy.permission_name,
                    resource_name:
                        policy.resource_name,
                    action: policy.action
                }
            });
        }


        // ----------------------------------------------------
        // Unknown action
        // ----------------------------------------------------

        return res.status(500).json({

            success: false,

            decision: "DENY",

            reason:
                "Unknown policy action."
        });


    } catch (error) {

        console.error(
            "Continuous authentication error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Continuous authentication failed.",

            error:
                error.message
        });
    }
};