const db = require('../config/db');
const { calculateRisk } = require('../services/riskEngine');
const continuousAuthModel = require('../models/continuousAuthModel');

/**
 * Continuous Authentication Middleware
 * Continuously evaluates risk and enforces security policies mid-session.
 * 
 * @param {string} resourceName - The name of the resource (matches security_policies.resource_name)
 * @param {number} permissionId - The ID of the required permission (matches security_policies.permission_id)
 */
const continuousAuth = (resourceName, permissionId) => async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const roleId = req.user?.role_id;
        
        // 1. Extract Token
        const authHeader = req.headers["authorization"];
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, message: "No token provided." });
        }
        const token = authHeader.split(" ")[1];

        // 2. Fetch Active Session
        const [sessions] = await db.query(`
            SELECT * FROM user_sessions 
            WHERE jwt_token = ? AND status = 'Active'
        `, [token]);

        if (sessions.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: "Session is expired or invalid. Please log in again." 
            });
        }
        const activeSession = sessions[0];

        // 3. Fetch Device Details
        const device = await continuousAuthModel.getUserDevice(userId, activeSession.device_id);
        if (!device) {
            return res.status(403).json({ success: false, message: "Device not found or blocked." });
        }

        // 4. Fetch Recent Login History
        const [recentLogins] = await db.query(`
            SELECT location, login_time 
            FROM login_history 
            WHERE user_id = ? AND status = 'Success' 
            ORDER BY login_time DESC 
            LIMIT 2
        `, [userId]);

        // 5. Gather incoming request signals
        const currentRequest = {
            fingerprint: req.headers['x-device-fingerprint'] || req.body?.fingerprint,
            browser: req.headers['user-agent']
        };

        // 6. CALCULATE REAL-TIME RISK
        const riskResult = calculateRisk({
            device,
            recentLoginHistory: recentLogins,
            activeSession,
            currentRequest
        });

        // The riskEngine returns riskScore (0-100, where higher is worse).
        // The PBAC policy uses trust_score (100 = perfect, lower is worse).
        // Translate real-time risk into the real-time trust score:
        const liveTrustScore = Math.max(0, 100 - riskResult.riskScore);

        // Calculate live device status based on the new trust score
        let liveDeviceStatus = device.status;
        if (device.status !== 'Blocked') { // Never unblock a blocked device automatically
            if (liveTrustScore >= 80) liveDeviceStatus = 'Trusted';
            else if (liveTrustScore >= 50) liveDeviceStatus = 'Pending';
            else liveDeviceStatus = 'Blocked';
        }
        
        req.liveTrustScore = liveTrustScore;

        // 7. Check PBAC Policy
        const policy = await continuousAuthModel.findApplicablePolicy(
            roleId, 
            permissionId, 
            resourceName, 
            liveDeviceStatus, 
            liveTrustScore
        );

        // If no policy exists for this resource, fallback to standard JWT allowance (it's not sensitive)
        if (!policy) {
            return next();
        }

        const action = policy.action.toUpperCase();

        // 8. Enforce Policy Decision
        if (action === 'ALLOW') {
            return next();
        }

        if (action === 'MFA') {
            // Check if they already passed MFA in this session
            const { isMfaCleared, generateOTP } = require('../services/mfaService');
            if (isMfaCleared(activeSession.session_id)) {
                return next(); // They already passed MFA, let them through
            }

            // Generate OTP
            generateOTP(activeSession.session_id);

            // Log to audit
            await db.query(`
                INSERT INTO audit_logs (user_id, action, module, description, ip_address, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())
            `, [userId, 'Continuous Auth MFA Triggered', 'Security', `Policy '${policy.policy_name}' required MFA due to risk score ${riskResult.riskScore}.`, req.ip]);
            
            // Return specific 401 payload for the frontend to branch on
            return res.status(401).json({
                success: false,
                mfaRequired: true,
                message: "Security risk detected. Additional verification required."
            });
        }

        if (action === 'DENY') {
            // Kill the session immediately
            await db.query(`UPDATE user_sessions SET status = 'Expired', logout_time = NOW() WHERE session_id = ?`, [activeSession.session_id]);
            
            // Log to audit
            await db.query(`
                INSERT INTO audit_logs (user_id, action, module, description, ip_address, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())
            `, [userId, 'Continuous Auth Denied', 'Security', `Policy '${policy.policy_name}' denied access mid-session due to risk. Session terminated.`, req.ip]);
            
            return res.status(403).json({
                success: false,
                message: "Access denied due to elevated security risk. Your session has been terminated."
            });
        }

    } catch (error) {
        console.error("[ContinuousAuth] Error evaluating policy mid-session:", error);
        return res.status(500).json({ success: false, message: "Internal security error." });
    }
};

module.exports = continuousAuth;
