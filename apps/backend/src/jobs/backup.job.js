const cron = require('node-cron');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Ensure backups directory exists
const BACKUP_DIR = path.join(__dirname, '../../backups');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Execute the backup process
 */
const runBackup = async () => {
  try {
    console.log('[Cron] Starting database backup...');
    
    // 1. Gather all collections data
    const backupData = {
      timestamp: new Date().toISOString(),
      database: mongoose.connection.name || 'clinimind',
      collections: {}
    };

    const modelNames = mongoose.modelNames();
    for (const modelName of modelNames) {
      const Model = mongoose.model(modelName);
      const records = await Model.find({}).lean();
      backupData.collections[modelName] = records;
    }

    // 2. Compress backup content to gzip
    const jsonString = JSON.stringify(backupData, null, 2);
    const gzippedBuffer = zlib.gzipSync(jsonString);

    // 3. Save backup file locally
    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestampStr}.json.gz`;
    const localPath = path.join(BACKUP_DIR, filename);
    
    fs.writeFileSync(localPath, gzippedBuffer);
    console.log(`[Cron] Database backup saved locally at ${localPath}`);

    // 4. Cloudinary upload sync (if CLOUDINARY_URL is configured)
    if (process.env.CLOUDINARY_URL) {
      try {
        console.log('[Cron] Uploading backup to Cloudinary...');
        
        // Dynamically require cloudinary to avoid crash if not installed
        const cloudinary = require('cloudinary').v2;
        
        // Cloudinary config parses CLOUDINARY_URL automatically
        await cloudinary.uploader.upload(localPath, {
          resource_type: 'raw',
          folder: 'clinimind_backups',
          public_id: filename
        });
        
        console.log('[Cron] Database backup synced to Cloudinary successfully.');
      } catch (cloudErr) {
        console.error('[Cron Error] Cloudinary backup sync failed:', cloudErr.message);
      }
    } else {
      console.log('[Cron] Cloudinary sync skipped (CLOUDINARY_URL not configured).');
    }

    console.log('[Cron] Backup job completed successfully.');
  } catch (error) {
    console.error('[Cron Error] Backup job failed:', error);
  }
};

// Run daily at 02:00 AM
cron.schedule('0 2 * * *', runBackup);

module.exports = { runBackup };
