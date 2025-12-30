# Backup & Disaster Recovery Strategy

## Overview
This document outlines the backup and disaster recovery strategy for the WhatsApp Bot System (BotInteligente). The strategy ensures data durability, business continuity, and compliance with data protection regulations.

## Critical Data Components

### 1. PostgreSQL Database
- **Tenants, users, bots configuration**
- **Leads and conversation history**
- **Scoring rules, products, pipelines**
- **Audit logs and compliance data**

### 2. Session Files
- **WhatsApp authentication sessions** (`auth-sessions/`)
- **Baileys session state and credentials**
- **QR codes and connection state**

### 3. Media Files
- **Product images** (Cloudflare R2)
- **Bot images** (Cloudflare R2)
- **Uploaded files and attachments**

### 4. Application Configuration
- **Environment variables**
- **System prompts and AI configurations**
- **Tenant-specific settings**

## Backup Implementation

### Automated Database Backups
```bash
# Manual backup
npm run backup

# Database only (no sessions)
npm run backup:database-only

# Local backup only (no upload to R2)
npm run backup:no-upload
```

### Scheduled Backups (Production)
Add to crontab for daily backups at 2 AM:
```bash
0 2 * * * cd /path/to/app && npm run backup >> /var/log/backup.log 2>&1
```

### Environment Variables for Backup
```bash
# Required for R2 upload
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=your-backup-bucket
R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com

# Optional configuration
BACKUP_RETENTION_DAYS=30      # Days to keep local backups (default: 30)
MAX_LOCAL_BACKUPS=5           # Maximum local backups to keep (default: 5)
```

## Recovery Procedures

### 1. Database Restoration
```bash
# Step 1: Download backup from R2 or local backups/
# Step 2: Restore using pg_restore
pg_restore --clean --if-exists --dbname="postgresql://..." backup-file.dump

# Step 3: Verify restoration
psql "postgresql://..." -c "SELECT COUNT(*) FROM tenants;"
```

### 2. Session Recovery
```bash
# Extract session backup
tar -xzf sessions-*.tar.gz -C /

# Restart application to reload sessions
npm start
```

### 3. Full Disaster Recovery Scenario
**Assumptions:**
- Complete server loss
- Need to restore from cloud backups

**Recovery Steps:**
1. **Provision new infrastructure** (Railway/VM with PostgreSQL)
2. **Restore database** from latest R2 backup
3. **Restore session files** from R2 backup
4. **Configure environment variables** (store securely in 1Password/Vault)
5. **Deploy application code** from Git repository
6. **Verify system functionality** with smoke tests

## Retention Policy

| Data Type | Retention Period | Storage Location | Encryption |
|-----------|-----------------|------------------|------------|
| Database backups | 30 days | Local + R2 | At-rest (R2) |
| Session backups | 30 days | Local + R2 | At-rest (R2) |
| Application logs | 90 days | Railway logs | N/A |
| Audit logs | 365 days | PostgreSQL | Database encryption |

## Monitoring & Alerting

### Backup Health Checks
```javascript
// Add to schedulerExecutor.js or create monitoring service
async function verifyBackupHealth() {
  const latestBackup = await findLatestBackup();
  const backupAge = Date.now() - latestBackup.timestamp;
  
  if (backupAge > 24 * 60 * 60 * 1000) { // 24 hours
    sendAlert('Backup overdue', `Last backup: ${latestBackup.timestamp}`);
  }
  
  // Verify backup integrity
  const isValid = await verifyBackupIntegrity(latestBackup.filepath);
  if (!isValid) {
    sendAlert('Backup corruption detected', latestBackup.filename);
  }
}
```

### Alerting Thresholds
- **Critical**: No backup in 24 hours
- **Warning**: Backup size < 1MB (possible empty backup)
- **Info**: Successful backup completion

## Testing & Validation

### Quarterly Recovery Testing
1. **Test Objective**: Verify complete system restoration
2. **Test Environment**: Isolated staging environment
3. **Success Criteria**: 
   - All tenants accessible
   - Historical data intact
   - WhatsApp sessions reconnect
   - AI functionality operational
4. **Documentation**: Update recovery procedures based on findings

### Monthly Backup Integrity Checks
```bash
# Sample integrity check script
node scripts/verify-backup.js --backup latest.dump
```

## Compliance Considerations

### LGPD/LFPDPPP Requirements
- **Data Portability**: Backups enable data export for user requests
- **Right to Erasure**: Backup retention aligns with data minimization
- **Security**: Encrypted backups protect against unauthorized access

### Business Continuity
- **Recovery Time Objective (RTO)**: < 4 hours for critical functions
- **Recovery Point Objective (RPO)**: < 24 hours data loss
- **Maximum Tolerable Downtime**: 8 hours

## Implementation Notes

### Cloudflare R2 Configuration
1. Create bucket with versioning enabled
2. Configure lifecycle rules for automatic cleanup
3. Enable bucket encryption
4. Set up access policies (least privilege)

### Local Storage Considerations
- Ensure `/backups` directory has sufficient disk space
- Monitor disk usage to prevent backup failures
- Consider separate volume for backup storage

### Security Best Practices
1. **Encryption**: All backups encrypted at rest (R2 default)
2. **Access Control**: Minimal permissions for backup service account
3. **Audit Logging**: Log all backup operations to audit table
4. **Key Management**: Rotate R2 access keys quarterly

## Troubleshooting

### Common Issues

#### Backup Fails - Disk Space
```bash
# Check disk usage
df -h /path/to/backups

# Clean up old backups
find /path/to/backups -name "*.dump" -mtime +30 -delete
```

#### R2 Upload Fails
- Verify R2 credentials are correct
- Check network connectivity to Cloudflare
- Verify bucket exists and is accessible

#### pg_dump Fails
- Check DATABASE_URL format
- Verify PostgreSQL user has backup privileges
- Check for long-running transactions blocking dump

#### Session Backup Large
- Consider excluding old/inactive sessions
- Implement session cleanup before backup
- Use incremental backup for sessions

## Future Enhancements

### Planned Improvements
1. **Incremental Backups**: Reduce backup size and time
2. **Point-in-Time Recovery**: WAL archiving for precise recovery
3. **Cross-Region Replication**: Geographic redundancy
4. **Automated Recovery Testing**: Scheduled disaster recovery drills
5. **Backup Dashboard**: Web interface for backup management

### Integration with Monitoring
- Integrate with Datadog/New Relic for backup metrics
- Slack/Email notifications for backup status
- Automated health checks post-restoration

---

**Last Updated**: December 2025  
**Next Review**: March 2026 (Quarterly)  
**Responsible Team**: DevOps & Data Engineering