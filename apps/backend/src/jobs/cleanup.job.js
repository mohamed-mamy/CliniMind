const cron = require('node-cron');
const AuditLog = require('../modules/audit/audit.model');

/**
 * Execute the log cleanup process.
 * Configurable via environment variables:
 * - RETENTION_MONTHS: Number of months to retain audit logs (default: 12)
 * - ALLOW_HARD_DELETE: Must be set to 'true' to perform actual deletion (default: false / dry-run)
 */
const runCleanup = async () => {
  try {
    const retentionMonths = parseInt(process.env.RETENTION_MONTHS, 10) || 12;
    const allowHardDelete = process.env.ALLOW_HARD_DELETE === 'true';

    console.log(`[Cron] Starting audit log cleanup (retention: ${retentionMonths} months, hard_delete: ${allowHardDelete})...`);
    
    const cutOffDate = new Date();
    cutOffDate.setMonth(cutOffDate.getMonth() - retentionMonths);

    // Count records that would be affected
    const candidateCount = await AuditLog.countDocuments({ timestamp: { $lt: cutOffDate } });
    console.log(`[Cron] Found ${candidateCount} audit log records older than ${cutOffDate.toISOString()}.`);

    if (candidateCount === 0) {
      console.log('[Cron] No records to clean up. Done.');
      return;
    }

    if (!allowHardDelete) {
      console.log('[Cron] ALLOW_HARD_DELETE is not enabled. Skipping deletion (dry-run). Set ALLOW_HARD_DELETE=true to enable.');
      return;
    }

    const result = await AuditLog.deleteMany({ timestamp: { $lt: cutOffDate } });
    console.log(`[Cron] Audit log cleanup completed. Deleted ${result.deletedCount} records older than ${cutOffDate.toISOString()}.`);
  } catch (error) {
    console.error('[Cron Error] Cleanup job failed:', error);
  }
};

// Run weekly on Sunday at 03:00 AM
cron.schedule('0 3 * * 0', runCleanup);

module.exports = { runCleanup };
