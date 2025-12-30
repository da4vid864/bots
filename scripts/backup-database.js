#!/usr/bin/env node
/**
 * Database Backup Script
 * 
 * This script performs automated backups of the PostgreSQL database
 * and WhatsApp session files to Cloudflare R2 (S3-compatible storage).
 * 
 * Usage:
 *   node scripts/backup-database.js [--full] [--upload]
 * 
 * Environment Variables Required:
 *   DATABASE_URL - PostgreSQL connection string
 *   R2_ACCESS_KEY_ID - Cloudflare R2 access key
 *   R2_SECRET_ACCESS_KEY - Cloudflare R2 secret key
 *   R2_BUCKET_NAME - R2 bucket name for backups
 *   R2_ENDPOINT - R2 endpoint URL
 */

require('dotenv').config();
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');

const execAsync = promisify(exec);

// Configuration
const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const SESSION_DIR = path.join(__dirname, '..', 'auth-sessions');
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS) || 30;
const MAX_LOCAL_BACKUPS = parseInt(process.env.MAX_LOCAL_BACKUPS) || 5;

// S3/R2 Configuration
const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Generate a unique backup filename with timestamp
 */
function generateBackupFilename(type) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const hash = crypto.randomBytes(4).toString('hex');
  return `${type}-${timestamp}-${hash}.dump`;
}

/**
 * Create backup directory if it doesn't exist
 */
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`✅ Created backup directory: ${BACKUP_DIR}`);
  }
}

/**
 * Perform PostgreSQL database dump using pg_dump
 */
async function backupDatabase() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const filename = generateBackupFilename('database');
  const filepath = path.join(BACKUP_DIR, filename);
  
  console.log(`📦 Starting database backup to: ${filepath}`);
  
  // Use pg_dump with custom format for efficient backup
  const command = `pg_dump "${dbUrl}" --format=custom --file="${filepath}"`;
  
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stderr && !stderr.includes('WARNING')) {
      console.warn(`⚠️ pg_dump warnings: ${stderr}`);
    }
    
    const stats = fs.statSync(filepath);
    console.log(`✅ Database backup completed: ${filename} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
    
    return { filename, filepath, size: stats.size };
  } catch (error) {
    console.error(`❌ Database backup failed:`, error.message);
    // Clean up partial backup file if it exists
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
    throw error;
  }
}

/**
 * Backup WhatsApp session files
 */
async function backupSessions() {
  if (!fs.existsSync(SESSION_DIR)) {
    console.log(`📁 No session directory found at ${SESSION_DIR}`);
    return null;
  }

  const filename = generateBackupFilename('sessions');
  const filepath = path.join(BACKUP_DIR, filename);
  
  console.log(`📦 Starting session backup to: ${filepath}`);
  
  // Create tar archive of session files
  const command = `tar -czf "${filepath}" -C "${path.dirname(SESSION_DIR)}" "${path.basename(SESSION_DIR)}"`;
  
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stderr && !stderr.includes('Removing leading')) {
      console.warn(`⚠️ tar warnings: ${stderr}`);
    }
    
    const stats = fs.statSync(filepath);
    console.log(`✅ Session backup completed: ${filename} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
    
    return { filename, filepath, size: stats.size };
  } catch (error) {
    console.error(`❌ Session backup failed:`, error.message);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
    throw error;
  }
}

/**
 * Upload backup to Cloudflare R2
 */
async function uploadToR2(filepath, filename) {
  if (!process.env.R2_BUCKET_NAME) {
    console.log('⚠️ R2_BUCKET_NAME not set, skipping upload');
    return null;
  }

  console.log(`☁️ Uploading ${filename} to R2...`);
  
  const fileContent = fs.readFileSync(filepath);
  
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: `backups/${filename}`,
    Body: fileContent,
    ContentType: 'application/octet-stream',
    Metadata: {
      'backup-date': new Date().toISOString(),
      'backup-type': filename.startsWith('database') ? 'database' : 'sessions',
    },
  });

  try {
    const response = await s3Client.send(command);
    console.log(`✅ Upload completed: ${filename} (ETag: ${response.ETag})`);
    return response;
  } catch (error) {
    console.error(`❌ Upload failed:`, error.message);
    throw error;
  }
}

/**
 * Clean up old local backups based on retention policy
 */
function cleanupOldBackups() {
  console.log(`🧹 Cleaning up backups older than ${RETENTION_DAYS} days...`);
  
  const files = fs.readdirSync(BACKUP_DIR);
  const now = Date.now();
  const retentionMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;
  
  let deletedCount = 0;
  
  files.forEach(file => {
    const filepath = path.join(BACKUP_DIR, file);
    const stats = fs.statSync(filepath);
    
    // Delete files older than retention period
    if (now - stats.mtimeMs > retentionMs) {
      fs.unlinkSync(filepath);
      console.log(`🗑️ Deleted old backup: ${file}`);
      deletedCount++;
    }
  });
  
  // Also limit total number of local backups
  const allBackups = fs.readdirSync(BACKUP_DIR)
    .map(file => ({
      file,
      path: path.join(BACKUP_DIR, file),
      mtime: fs.statSync(path.join(BACKUP_DIR, file)).mtimeMs
    }))
    .sort((a, b) => b.mtime - a.mtime); // newest first
  
  if (allBackups.length > MAX_LOCAL_BACKUPS) {
    const toDelete = allBackups.slice(MAX_LOCAL_BACKUPS);
    toDelete.forEach(({ file, path: filepath }) => {
      fs.unlinkSync(filepath);
      console.log(`🗑️ Deleted excess backup: ${file}`);
      deletedCount++;
    });
  }
  
  console.log(`✅ Cleanup completed: ${deletedCount} backups removed`);
}

/**
 * Main backup procedure
 */
async function runBackup(options = {}) {
  const { upload = true, full = true } = options;
  
  console.log('🚀 Starting backup procedure...');
  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log(`📊 Retention: ${RETENTION_DAYS} days`);
  console.log(`📤 Upload to R2: ${upload ? 'Yes' : 'No'}`);
  
  try {
    ensureBackupDir();
    
    // Perform database backup
    const dbBackup = await backupDatabase();
    
    // Perform session backup if full backup requested
    let sessionBackup = null;
    if (full) {
      sessionBackup = await backupSessions();
    }
    
    // Upload to R2 if configured
    if (upload) {
      await uploadToR2(dbBackup.filepath, dbBackup.filename);
      if (sessionBackup) {
        await uploadToR2(sessionBackup.filepath, sessionBackup.filename);
      }
    }
    
    // Clean up old backups
    cleanupOldBackups();
    
    console.log('🎉 Backup procedure completed successfully!');
    
    return {
      success: true,
      database: dbBackup,
      sessions: sessionBackup,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('💥 Backup procedure failed:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    upload: !args.includes('--no-upload'),
    full: !args.includes('--database-only'),
  };
  return options;
}

// Run if called directly
if (require.main === module) {
  const options = parseArgs();
  runBackup(options)
    .then(result => {
      if (!result.success) {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = {
  runBackup,
  backupDatabase,
  backupSessions,
  uploadToR2,
  cleanupOldBackups
};