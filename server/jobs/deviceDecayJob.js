const cron = require('node-cron');
const db = require('../config/db');

// Configurable Constants (You can easily adjust these for the demo)
const STALENESS_THRESHOLD_DAYS = 15; // Days of inactivity before decay starts
const DECAY_AMOUNT = 5;              // How much trust score drops per job run
const PENDING_THRESHOLD = 50;        // Trust score below this moves device to 'Pending'

/**
 * Executes the decay logic for stale devices.
 */
const runDeviceDecay = async () => {
    console.log('[DeviceDecayJob] Running device trust decay background job...');
    
    try {
        // 1. Find all stale devices (last_used > STALENESS_THRESHOLD_DAYS)
        // that are NOT already 'Blocked'.
        const [devices] = await db.query(`
            SELECT id, user_id, device_name, trust_score, status, last_used
            FROM devices
            WHERE status != 'Blocked'
              AND last_used < DATE_SUB(NOW(), INTERVAL ? DAY)
        `, [STALENESS_THRESHOLD_DAYS]);

        if (!devices.length) {
            console.log('[DeviceDecayJob] No stale devices found. Exiting job.');
            return;
        }

        // 2. Fetch devices that currently have an 'Active' session to exclude them
        const [activeSessions] = await db.query(`
            SELECT DISTINCT device_id 
            FROM user_sessions 
            WHERE status = 'Active'
        `);
        const activeDeviceIds = new Set(activeSessions.map(s => s.device_id));

        // 3. Process each stale device
        for (const device of devices) {
            // A device being actively used isn't stale by definition.
            if (activeDeviceIds.has(device.id)) {
                continue;
            }

            const oldScore = device.trust_score || 0;
            const newScore = Math.max(0, oldScore - DECAY_AMOUNT); // Floor at 0
            
            // If the score is 0 and it's already Pending, there is nothing left to decay
            if (newScore === oldScore && device.status === 'Pending') {
                continue; 
            }

            // Auto-transition to 'Pending' if it drops below threshold
            let newStatus = device.status;
            let statusChanged = false;
            
            if (device.status === 'Trusted' && newScore < PENDING_THRESHOLD) {
                newStatus = 'Pending';
                statusChanged = true;
            }

            // Persist the decay
            await db.query(`
                UPDATE devices 
                SET trust_score = ?, status = ? 
                WHERE id = ?
            `, [newScore, newStatus, device.id]);

            // Log the action to the audit trail
            let description = `Trust score decayed from ${oldScore} to ${newScore} due to ${STALENESS_THRESHOLD_DAYS}+ days of inactivity.`;
            if (statusChanged) {
                description += ` Status downgraded to Pending.`;
            }

            await db.query(`
                INSERT INTO audit_logs (user_id, action, module, description, ip_address, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())
            `, [device.user_id, 'Trust Score Decay', 'Device Trust', description, 'System']);
            
            console.log(`[DeviceDecayJob] Device ${device.id} (User ${device.user_id}): ${description}`);
        }
        
    } catch (error) {
        console.error('[DeviceDecayJob] Error running device decay job:', error);
    }
};

/**
 * Initializes the background scheduled job.
 * @param {string} schedule - Cron expression (default: every hour on the hour).
 * Use '* * * * *' for every minute (useful for testing).
 */
const initDecayJob = (schedule = '0 * * * *') => {
    console.log(`[DeviceDecayJob] Scheduled with pattern: ${schedule}`);
    cron.schedule(schedule, runDeviceDecay);
};

module.exports = {
    initDecayJob,
    runDeviceDecay
};
