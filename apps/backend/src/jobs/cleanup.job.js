const cron = require('node-cron');
const AuditLog = require('../modules/audit/audit.model');

/**
 * Execute the log cleanup process
 */
const runCleanup = async () => {
  try {
    console.log('[Cron] Starting audit log cleanup (deleting records older than 12 months)...');
    
    const cutOffDate = new Date();
    cutOffDate.setMonth(cutOffDate.getMonth() - 12);
    
    const result = await AuditLog.deleteMany({ timestamp: { $lt: cutOffDate } });
    
    console.log(`[Cron] Audit log cleanup completed. Deleted ${result.deletedCount} records older than ${cutOffDate.toISOString()}`);
  } catch (error) {
    console.error('[Cron Error] Cleanup job failed:', error);
  }
};

// Run weekly on Sunday at 03:00 AM
cron.schedule('0 3 * * 0', runCleanup);

module.exports = { runCleanup };
