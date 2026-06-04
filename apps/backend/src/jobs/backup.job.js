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
 * Execute the backup process using streaming to avoid loading entire DB into memory.
 */
const runBackup = async () => {
  try {
    console.log('[Cron] Starting database backup...');
    
    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestampStr}.ndjson.gz`;
    const localPath = path.join(BACKUP_DIR, filename);

    // Create a gzip write stream
    const gzipStream = zlib.createGzip();
    const writeStream = fs.createWriteStream(localPath);
    gzipStream.pipe(writeStream);

    // Write metadata header
    const metadata = {
      _type: 'backup_metadata',
      timestamp: new Date().toISOString(),
      database: mongoose.connection.name || 'clinimind'
    };
    gzipStream.write(JSON.stringify(metadata) + '\n');

    // Stream each collection as NDJSON
    const modelNames = mongoose.modelNames();
    for (const modelName of modelNames) {
      const Model = mongoose.model(modelName);
      const cursor = Model.find({}).cursor();

      for await (const doc of cursor) {
        const record = {
          _collection: modelName,
          ...doc.toObject()
        };
        gzipStream.write(JSON.stringify(record) + '\n');
      }
    }

    // Finalize the gzip stream
    await new Promise((resolve, reject) => {
      gzipStream.end(() => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });
    });

    console.log(`[Cron] Database backup saved locally at ${localPath}`);

    // Cloudinary upload (opt-in only via ALLOW_CLOUD_BACKUP)
    if (process.env.CLOUDINARY_URL && process.env.ALLOW_CLOUD_BACKUP === 'true') {
      try {
        console.log('[Cron] Uploading backup to Cloudinary...');
        
        // Dynamically require cloudinary to avoid crash if not installed
        const cloudinary = require('cloudinary').v2;
        
        // Cloudinary config parses CLOUDINARY_URL automatically
        await cloudinary.uploader.upload(localPath, {
          resource_type: 'raw',
          folder: 'clinimind_backups',
          public_id: filename,
          tags: ['backup', 'automated']
        });
        
        console.log('[Cron] Database backup synced to Cloudinary successfully.');
      } catch (cloudErr) {
        console.error('[Cron Error] Cloudinary backup sync failed:', cloudErr.message);
      }
    } else if (process.env.CLOUDINARY_URL && process.env.ALLOW_CLOUD_BACKUP !== 'true') {
      console.log('[Cron] Cloudinary sync skipped (ALLOW_CLOUD_BACKUP not enabled).');
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
