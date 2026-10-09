/**
 * services/mfaService.js
 * In-memory storage for MFA OTPs as requested (no new DB tables).
 */

const mfaStore = new Map(); // Maps session_id -> { code, expiresAt }
const mfaClearedStore = new Set(); // Stores session_id of sessions that successfully passed MFA

/**
 * Generate a 6-digit OTP for a session.
 */
const generateOTP = (sessionId) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins TTL
    
    mfaStore.set(sessionId, { code, expiresAt });
    
    // For demo purposes and as requested for the MCA project, log the code to the console
    console.log(`\n=========================================`);
    console.log(`[MFA TRIGGERED] Code generated: ${code}`);
    console.log(`[MFA TRIGGERED] Session ID: ${sessionId}`);
    console.log(`=========================================\n`);
    
    return code;
};

/**
 * Verify an OTP code.
 */
const verifyOTP = (sessionId, submittedCode) => {
    const record = mfaStore.get(sessionId);
    
    if (!record) return false; // No code generated
    
    if (Date.now() > record.expiresAt) {
        mfaStore.delete(sessionId); // Expired
        return false;
    }
    
    if (record.code === submittedCode) {
        mfaStore.delete(sessionId); // Consume code
        mfaClearedStore.add(sessionId); // Mark session as having passed MFA
        
        // Setup a TTL for the clearance so they don't get free passes forever?
        // Let's keep it simple: clears it for the remainder of this session.
        return true;
    }
    
    return false;
};

/**
 * Check if the session recently passed MFA.
 */
const isMfaCleared = (sessionId) => {
    return mfaClearedStore.has(sessionId);
};

module.exports = {
    generateOTP,
    verifyOTP,
    isMfaCleared
};
