/**
 * services/riskEngine.js
 * 
 * A pure, reusable risk-calculation module for Dynamic Risk Scoring.
 * It is completely detached from Express (no req/res) so it can be used 
 * by both the continuous authentication middleware and background workers.
 */

/**
 * Calculates a dynamic risk score based on various signals.
 * 
 * @param {Object} params - The signals to evaluate.
 * @param {Object} params.device - The device record from the DB (id, status, trust_score, fingerprint, browser, last_used).
 * @param {Array} params.recentLoginHistory - Array of the user's recent successful logins (descending order by time).
 * @param {Object} params.activeSession - The current user session record (login_time).
 * @param {Object} params.currentRequest - The current incoming request fingerprint data { fingerprint, browser }.
 * 
 * @returns {Object} { riskScore (0-100), riskLevel ('LOW' | 'MEDIUM' | 'HIGH'), factors (Array of reasons) }
 */
const calculateRisk = ({ 
    device, 
    recentLoginHistory = [], 
    activeSession = null, 
    currentRequest = null 
}) => {
    let riskScore = 0;
    const factors = [];

    if (!device) {
        return {
            riskScore: 100,
            riskLevel: 'HIGH',
            factors: [{ signal: 'Unknown Device', contribution: 100, detail: 'Device record is missing.' }]
        };
    }

    // ----------------------------------------------------
    // 1. Device Status Risk
    // ----------------------------------------------------
    if (device.status === 'Blocked') {
        riskScore += 100;
        factors.push({ signal: 'Device Blocked', contribution: 100, detail: 'The device is explicitly blocked.' });
    } else if (device.status === 'Pending') {
        riskScore += 30;
        factors.push({ signal: 'Device Pending', contribution: 30, detail: 'The device has not been fully verified/trusted yet.' });
    }

    // ----------------------------------------------------
    // 2. Base Trust Score Deficit
    // ----------------------------------------------------
    // If the device's stored trust score is low, that represents an existing baseline risk.
    // E.g., trust_score 60 means a deficit of 40. We add half the deficit as a real-time risk factor.
    const trustDeficit = Math.max(0, 100 - (device.trust_score || 0));
    if (trustDeficit > 0) {
        const contribution = Math.floor(trustDeficit / 2);
        riskScore += contribution;
        factors.push({ 
            signal: 'Low Base Trust', 
            contribution, 
            detail: `The stored device trust score is currently ${device.trust_score || 0}.` 
        });
    }

    // ----------------------------------------------------
    // 3. Fingerprint & Browser Mismatch
    // ----------------------------------------------------
    if (currentRequest) {
        if (currentRequest.fingerprint && currentRequest.fingerprint !== device.fingerprint) {
            riskScore += 40;
            factors.push({ signal: 'Fingerprint Mismatch', contribution: 40, detail: 'The current request fingerprint does not match the registered device fingerprint.' });
        }
        if (currentRequest.browser && currentRequest.browser !== device.browser) {
            riskScore += 15;
            factors.push({ signal: 'Browser Mismatch', contribution: 15, detail: 'The current browser does not match the registered device browser.' });
        }
    }

    // ----------------------------------------------------
    // 4. Session Age
    // ----------------------------------------------------
    if (activeSession && activeSession.login_time) {
        const sessionHours = (Date.now() - new Date(activeSession.login_time).getTime()) / (1000 * 60 * 60);
        if (sessionHours > 24) {
            riskScore += 25;
            factors.push({ signal: 'Stale Session', contribution: 25, detail: `The active session is ${Math.floor(sessionHours)} hours old.` });
        } else if (sessionHours > 8) {
            riskScore += 10;
            factors.push({ signal: 'Long Session', contribution: 10, detail: `The active session is ${Math.floor(sessionHours)} hours old.` });
        }
    }

    // ----------------------------------------------------
    // 5. Login Anomaly (Impossible Travel)
    // ----------------------------------------------------
    // Compare the two most recent successful logins to see if location changed too fast.
    if (recentLoginHistory && recentLoginHistory.length >= 2) {
        const currentLogin = recentLoginHistory[0];
        const prevLogin = recentLoginHistory[1];
        
        if (currentLogin.location && prevLogin.location && currentLogin.location !== prevLogin.location) {
            const timeGapHours = Math.abs(new Date(currentLogin.login_time).getTime() - new Date(prevLogin.login_time).getTime()) / (1000 * 60 * 60);
            
            // If the user changed regions in under 2 hours, flag as impossible travel.
            if (timeGapHours < 2) { 
                riskScore += 40;
                factors.push({ 
                    signal: 'Impossible Travel Anomaly', 
                    contribution: 40, 
                    detail: `Location changed abruptly from ${prevLogin.location} to ${currentLogin.location} in ${timeGapHours.toFixed(1)} hours.`
                });
            } else if (timeGapHours < 8) {
                // Moderate risk for changing locations same-day.
                riskScore += 15;
                factors.push({ 
                    signal: 'Rapid Travel Anomaly', 
                    contribution: 15, 
                    detail: `Location changed from ${prevLogin.location} to ${currentLogin.location} in ${timeGapHours.toFixed(1)} hours.`
                });
            }
        }
    }

    // ----------------------------------------------------
    // 6. Device Staleness
    // ----------------------------------------------------
    if (device.last_used) {
        const staleDays = (Date.now() - new Date(device.last_used).getTime()) / (1000 * 60 * 60 * 24);
        if (staleDays > 30) {
            riskScore += 25;
            factors.push({ signal: 'Device Staleness', contribution: 25, detail: `Device hasn't been used in ${Math.floor(staleDays)} days.` });
        } else if (staleDays > 14) {
            riskScore += 10;
            factors.push({ signal: 'Device Staleness', contribution: 10, detail: `Device hasn't been used in ${Math.floor(staleDays)} days.` });
        }
    }

    // ----------------------------------------------------
    // Finalize Score and Level
    // ----------------------------------------------------
    riskScore = Math.floor(Math.min(riskScore, 100)); // Cap at 100 max
    
    let riskLevel = 'LOW';
    if (riskScore >= 70) {
        riskLevel = 'HIGH';
    } else if (riskScore >= 35) {
        riskLevel = 'MEDIUM';
    }

    return {
        riskScore,
        riskLevel,
        factors
    };
};

module.exports = {
    calculateRisk
};
