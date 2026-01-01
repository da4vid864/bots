/**
 * Data Integrity Monitoring Service
 * 
 * Monitors database health, detects data corruption, and alerts on integrity issues
 * for the WhatsApp bot system.
 */

import { query as pool } from './db.js';
import { withTransaction } from './transactionUtils.js';

/**
 * Data integrity check results
 */
class IntegrityCheckResult {
    constructor(checkName, status, issues = [], metrics = {}) {
        this.checkName = checkName;
        this.status = status; // 'healthy', 'warning', 'critical'
        this.issues = issues;
        this.metrics = metrics;
        this.timestamp = new Date().toISOString();
    }
}

/**
 * Data Integrity Monitor
 */
class DataIntegrityMonitor {
    constructor() {
        this.checks = [];
        this.alerts = [];
        this.lastRun = null;
        
        // Register all checks
        this.registerChecks();
    }
    
    /**
     * Register all integrity checks
     */
    registerChecks() {
        this.checks = [
            this.checkOrphanedRecords.bind(this),
            this.checkForeignKeyViolations.bind(this),
            this.checkNullConstraints.bind(this),
            this.checkDataTypes.bind(this),
            this.checkDuplicateRecords.bind(this),
            this.checkReferentialIntegrity.bind(this),
            this.checkTenantIsolation.bind(this),
            this.checkAuditLogCompleteness.bind(this)
        ];
    }
    
    /**
     * Run all integrity checks
     * @returns {Promise<Array<IntegrityCheckResult>>} - Results of all checks
     */
    async runAllChecks() {
        const results = [];
        
        for (const check of this.checks) {
            try {
                const result = await check();
                results.push(result);
                
                // Log critical issues
                if (result.status === 'critical') {
                    await this.logAlert(result);
                }
            } catch (error) {
                results.push(new IntegrityCheckResult(
                    check.name || 'Unknown Check',
                    'critical',
                    [`Check failed: ${error.message}`]
                ));
            }
        }
        
        this.lastRun = new Date();
        return results;
    }
    
    /**
     * Check for orphaned records (records without parent)
     */
    async checkOrphanedRecords() {
        const issues = [];
        const metrics = {};
        
        // Check leads without assigned bot
        const leadsResult = await pool(`
            SELECT COUNT(*) as count
            FROM leads l
            LEFT JOIN bots b ON l.bot_id = b.id
            WHERE b.id IS NULL AND l.bot_id IS NOT NULL
        `);
        
        const orphanedLeads = parseInt(leadsResult.rows[0].count);
        metrics.orphanedLeads = orphanedLeads;
        
        if (orphanedLeads > 0) {
            issues.push(`Found ${orphanedLeads} leads without associated bot`);
        }
        
        // Check lead_messages without lead
        const messagesResult = await pool(`
            SELECT COUNT(*) as count
            FROM lead_messages lm
            LEFT JOIN leads l ON lm.lead_id = l.id
            WHERE l.id IS NULL
        `);
        
        const orphanedMessages = parseInt(messagesResult.rows[0].count);
        metrics.orphanedMessages = orphanedMessages;
        
        if (orphanedMessages > 0) {
            issues.push(`Found ${orphanedMessages} lead messages without associated lead`);
        }
        
        // Check bot_images without bot
        const imagesResult = await pool(`
            SELECT COUNT(*) as count
            FROM bot_images bi
            LEFT JOIN bots b ON bi.bot_id = b.id
            WHERE b.id IS NULL
        `);
        
        const orphanedImages = parseInt(imagesResult.rows[0].count);
        metrics.orphanedImages = orphanedImages;
        
        if (orphanedImages > 0) {
            issues.push(`Found ${orphanedImages} bot images without associated bot`);
        }
        
        const status = issues.length > 0 ? 'warning' : 'healthy';
        return new IntegrityCheckResult('Orphaned Records Check', status, issues, metrics);
    }
    
    /**
     * Check for foreign key constraint violations
     */
    async checkForeignKeyViolations() {
        const issues = [];
        const metrics = {};
        
        // This check runs SQL that would fail if foreign keys are violated
        // We'll check common foreign key relationships
        
        try {
            // Check leads.assigned_to references users.email
            const assignedCheck = await pool(`
                SELECT COUNT(*) as count
                FROM leads l
                LEFT JOIN users u ON l.assigned_to = u.email
                WHERE l.assigned_to IS NOT NULL AND u.email IS NULL
            `);
            
            const invalidAssignments = parseInt(assignedCheck.rows[0].count);
            metrics.invalidAssignments = invalidAssignments;
            
            if (invalidAssignments > 0) {
                issues.push(`Found ${invalidAssignments} leads assigned to non-existent users`);
            }
            
            // Check leads.owner_user_id references users.id
            const ownerCheck = await pool(`
                SELECT COUNT(*) as count
                FROM leads l
                LEFT JOIN users u ON l.owner_user_id = u.id
                WHERE l.owner_user_id IS NOT NULL AND u.id IS NULL
            `);
            
            const invalidOwners = parseInt(ownerCheck.rows[0].count);
            metrics.invalidOwners = invalidOwners;
            
            if (invalidOwners > 0) {
                issues.push(`Found ${invalidOwners} leads with non-existent owner users`);
            }
            
        } catch (error) {
            issues.push(`Foreign key check failed: ${error.message}`);
        }
        
        const status = issues.length > 0 ? 'warning' : 'healthy';
        return new IntegrityCheckResult('Foreign Key Check', status, issues, metrics);
    }
    
    /**
     * Check for NULL constraint violations
     */
    async checkNullConstraints() {
        const issues = [];
        const metrics = {};
        
        // Check required fields that shouldn't be NULL
        const checks = [
            { table: 'users', column: 'email', description: 'User email' },
            { table: 'leads', column: 'whatsapp_number', description: 'Lead WhatsApp number' },
            { table: 'leads', column: 'name', description: 'Lead name' },
            { table: 'bots', column: 'name', description: 'Bot name' },
            { table: 'tenants', column: 'name', description: 'Tenant name' }
        ];
        
        for (const check of checks) {
            try {
                const result = await pool(`
                    SELECT COUNT(*) as count
                    FROM ${check.table}
                    WHERE ${check.column} IS NULL
                `);
                
                const nullCount = parseInt(result.rows[0].count);
                metrics[`${check.table}_${check.column}_null`] = nullCount;
                
                if (nullCount > 0) {
                    issues.push(`Found ${nullCount} ${check.table} records with NULL ${check.column}`);
                }
            } catch (error) {
                // Table or column might not exist
                continue;
            }
        }
        
        const status = issues.length > 0 ? 'critical' : 'healthy';
        return new IntegrityCheckResult('NULL Constraint Check', status, issues, metrics);
    }
    
    /**
     * Check data type consistency
     */
    async checkDataTypes() {
        const issues = [];
        const metrics = {};
        
        // Check UUID format consistency
        const uuidTables = ['users', 'bots', 'leads', 'tenants'];
        
        for (const table of uuidTables) {
            try {
                const result = await pool(`
                    SELECT COUNT(*) as count
                    FROM ${table}
                    WHERE id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                `);
                
                const invalidUUIDs = parseInt(result.rows[0].count);
                metrics[`${table}_invalid_uuids`] = invalidUUIDs;
                
                if (invalidUUIDs > 0) {
                    issues.push(`Found ${invalidUUIDs} invalid UUIDs in ${table} table`);
                }
            } catch (error) {
                // Table might not exist or column might not be UUID
                continue;
            }
        }
        
        // Check email format consistency
        try {
            const emailResult = await pool(`
                SELECT COUNT(*) as count
                FROM users
                WHERE email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
            `);
            
            const invalidEmails = parseInt(emailResult.rows[0].count);
            metrics.invalidEmails = invalidEmails;
            
            if (invalidEmails > 0) {
                issues.push(`Found ${invalidEmails} invalid email addresses in users table`);
            }
        } catch (error) {
            // Ignore if users table doesn't exist
        }
        
        const status = issues.length > 0 ? 'warning' : 'healthy';
        return new IntegrityCheckResult('Data Type Check', status, issues, metrics);
    }
    
    /**
     * Check for duplicate records
     */
    async checkDuplicateRecords() {
        const issues = [];
        const metrics = {};
        
        // Check for duplicate WhatsApp numbers in leads
        try {
            const duplicatePhones = await pool(`
                SELECT whatsapp_number, COUNT(*) as count
                FROM leads
                GROUP BY whatsapp_number
                HAVING COUNT(*) > 1
                LIMIT 10
            `);
            
            const duplicateCount = duplicatePhones.rows.length;
            metrics.duplicatePhones = duplicateCount;
            
            if (duplicateCount > 0) {
                issues.push(`Found ${duplicateCount} duplicate WhatsApp numbers in leads`);
                // Log first few duplicates
                duplicatePhones.rows.slice(0, 3).forEach(row => {
                    issues.push(`  - ${row.whatsapp_number}: ${row.count} duplicates`);
                });
            }
        } catch (error) {
            // Table might not exist
        }
        
        // Check for duplicate emails in users
        try {
            const duplicateEmails = await pool(`
                SELECT email, COUNT(*) as count
                FROM users
                GROUP BY email
                HAVING COUNT(*) > 1
                LIMIT 10
            `);
            
            const duplicateEmailCount = duplicateEmails.rows.length;
            metrics.duplicateEmails = duplicateEmailCount;
            
            if (duplicateEmailCount > 0) {
                issues.push(`Found ${duplicateEmailCount} duplicate emails in users`);
            }
        } catch (error) {
            // Table might not exist
        }
        
        const status = issues.length > 0 ? 'warning' : 'healthy';
        return new IntegrityCheckResult('Duplicate Records Check', status, issues, metrics);
    }
    
    /**
     * Check referential integrity
     */
    async checkReferentialIntegrity() {
        const issues = [];
        const metrics = {};
        
        // This is a comprehensive check of all foreign key relationships
        // We'll verify that every referenced record exists
        
        const relationships = [
            { child: 'leads', parent: 'bots', fk: 'bot_id', pk: 'id' },
            { child: 'lead_messages', parent: 'leads', fk: 'lead_id', pk: 'id' },
            { child: 'products', parent: 'bots', fk: 'bot_id', pk: 'id' },
            { child: 'bot_features', parent: 'bots', fk: 'bot_id', pk: 'id' },
            { child: 'bot_images', parent: 'bots', fk: 'bot_id', pk: 'id' },
            { child: 'schedules', parent: 'bots', fk: 'bot_id', pk: 'id' },
            { child: 'scoring_rules', parent: 'bots', fk: 'bot_id', pk: 'id' }
        ];
        
        for (const rel of relationships) {
            try {
                const result = await pool(`
                    SELECT COUNT(*) as count
                    FROM ${rel.child} c
                    LEFT JOIN ${rel.parent} p ON c.${rel.fk} = p.${rel.pk}
                    WHERE c.${rel.fk} IS NOT NULL AND p.${rel.pk} IS NULL
                `);
                
                const violationCount = parseInt(result.rows[0].count);
                metrics[`${rel.child}_${rel.fk}_violations`] = violationCount;
                
                if (violationCount > 0) {
                    issues.push(`Found ${violationCount} ${rel.child} records with invalid ${rel.fk} reference to ${rel.parent}`);
                }
            } catch (error) {
                // Table might not exist
                continue;
            }
        }
        
        const status = issues.length > 0 ? 'critical' : 'healthy';
        return new IntegrityCheckResult('Referential Integrity Check', status, issues, metrics);
    }
    
    /**
     * Check tenant isolation (Row Level Security)
     */
    async checkTenantIsolation() {
        const issues = [];
        const metrics = {};
        
        // Check if any records have NULL tenant_id (should not happen with RLS)
        const tables = ['users', 'bots', 'leads', 'products', 'schedules'];
        
        for (const table of tables) {
            try {
                const result = await pool(`
                    SELECT COUNT(*) as count
                    FROM ${table}
                    WHERE tenant_id IS NULL
                `);
                
                const nullTenantCount = parseInt(result.rows[0].count);
                metrics[`${table}_null_tenant`] = nullTenantCount;
                
                if (nullTenantCount > 0) {
                    issues.push(`Found ${nullTenantCount} ${table} records with NULL tenant_id`);
                }
            } catch (error) {
                // Table might not exist
                continue;
            }
        }
        
        const status = issues.length > 0 ? 'critical' : 'healthy';
        return new IntegrityCheckResult('Tenant Isolation Check', status, issues, metrics);
    }
    
    /**
     * Check audit log completeness
     */
    async checkAuditLogCompleteness() {
        const issues = [];
        const metrics = {};
        
        // Check if audit_logs table exists
        try {
            const tableExists = await pool(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'audit_logs'
                )
            `);
            
            if (!tableExists.rows[0].exists) {
                issues.push('audit_logs table does not exist');
                return new IntegrityCheckResult('Audit Log Check', 'warning', issues, metrics);
            }
            
            // Check for recent audit activity (last 24 hours)
            const recentActivity = await pool(`
                SELECT COUNT(*) as count
                FROM audit_logs
                WHERE created_at >= NOW() - INTERVAL '24 hours'
            `);
            
            const recentCount = parseInt(recentActivity.rows[0].count);
            metrics.recentAuditLogs = recentCount;
            
            if (recentCount === 0) {
                issues.push('No audit logs in the last 24 hours - audit logging may be broken');
            }
            
            // Check for NULL required fields
            const nullChecks = await pool(`
                SELECT 
                    SUM(CASE WHEN tenant_id IS NULL THEN 1 ELSE 0 END) as null_tenant,
                    SUM(CASE WHEN user_email IS NULL THEN 1 ELSE 0 END) as null_user,
                    SUM(CASE WHEN action IS NULL THEN 1 ELSE 0 END) as null_action
                FROM audit_logs
            `);
            
            const nullTenant = parseInt(nullChecks.rows[0].null_tenant);
            const nullUser = parseInt(nullChecks.rows[0].null_user);
            const nullAction = parseInt(nullChecks.rows[0].null_action);
            
            metrics.nullTenantAudits = nullTenant;
            metrics.nullUserAudits = nullUser;
            metrics.nullActionAudits = nullAction;
            
            if (nullTenant > 0) issues.push(`Found ${nullTenant} audit logs with NULL tenant_id`);
            if (nullUser > 0) issues.push(`Found ${nullUser} audit logs with NULL user_email`);
            if (nullAction > 0) issues.push(`Found ${nullAction} audit logs with NULL action`);
            
        } catch (error) {
            issues.push(`Audit log check failed: ${error.message}`);
        }
        
        const status = issues.length > 0 ? 'warning' : 'healthy';
        return new IntegrityCheckResult('Audit Log Check', status, issues, metrics);
    }
    
    /**
     * Log an alert for critical issues
     * @param {IntegrityCheckResult} result - Check result with critical issues
     */
    async logAlert(result) {
        const alert = {
            checkName: result.checkName,
            status: result.status,
            issues: result.issues,
            timestamp: new Date().toISOString()
        };
        
        this.alerts.push(alert);
        
        // Also log to database if audit_logs table exists
        try {
            await pool(`
                INSERT INTO audit_logs (tenant_id, user_email, action, resource_id, details)
                VALUES (
                    (SELECT id FROM tenants WHERE name = 'Default Tenant' LIMIT 1),
                    'system@botinteligente.com',
                    'DATA_INTEGRITY_ALERT',
                    '${result.checkName}',
                    $1
                )
            `, [JSON.stringify(alert)]);
        } catch (error) {
            // Silently fail if audit_logs doesn't exist
            console.error('Failed to log data integrity alert:', error.message);
        }
        
        // TODO: Send actual alert (email, Slack, etc.)
        console.error(`DATA INTEGRITY ALERT: ${result.checkName} - ${result.issues.join(', ')}`);
    }
    
    /**
     * Get summary of all checks
     * @returns {Promise<Object>} - Summary statistics
     */
    async getSummary() {
        const results = await this.runAllChecks();
        
        const summary = {
            totalChecks: results.length,
            healthyChecks: results.filter(r => r.status === 'healthy').length,
            warningChecks: results.filter(r => r.status === 'warning').length,
            criticalChecks: results.filter(r => r.status === 'critical').length,
            totalIssues: results.reduce((sum, r) => sum + r.issues.length, 0),
            lastRun: this.lastRun,
            results: results.map(r => ({
                checkName: r.checkName,
                status: r.status,
                issueCount: r.issues.length,
                timestamp: r.timestamp
            }))
        };
        
        return summary;
    }
    
    /**
     * Get detailed report of all checks
     * @returns {Promise<Object>} - Detailed report
     */
    async getDetailedReport() {
        const results = await this.runAllChecks();
        
        return {
            timestamp: new Date().toISOString(),
            summary: await this.getSummary(),
            checks: results,
            alerts: this.alerts.slice(-10) // Last 10 alerts
        };
    }
    
    /**
     * Fix common integrity issues automatically
     * @returns {Promise<Object>} - Fix results
     */
    async fixIssues() {
        const fixes = [];
        
        // Fix orphaned records by deleting them
        try {
            const orphanedLeads = await pool(`
                DELETE FROM leads
                WHERE bot_id IS NOT NULL
                AND bot_id NOT IN (SELECT id FROM bots)
                RETURNING COUNT(*) as count
            `);
            
            if (orphanedLeads.rows[0].count > 0) {
                fixes.push(`Deleted ${orphanedLeads.rows[0].count} orphaned leads`);
            }
        } catch (error) {
            // Ignore if query fails
        }
        
        // Fix NULL tenant_id by setting to default tenant
        try {
            const defaultTenant = await pool(`
                SELECT id FROM tenants WHERE name = 'Default Tenant' LIMIT 1
            `);
            
            if (defaultTenant.rows.length > 0) {
                const defaultTenantId = defaultTenant.rows[0].id;
                
                const tables = ['users', 'bots', 'leads', 'products', 'schedules'];
                for (const table of tables) {
                    try {
                        const fixed = await pool(`
                            UPDATE ${table}
                            SET tenant_id = $1
                            WHERE tenant_id IS NULL
                            RETURNING COUNT(*) as count
                        `, [defaultTenantId]);
                        
                        if (fixed.rows[0].count > 0) {
                            fixes.push(`Fixed ${fixed.rows[0].count} ${table} records with NULL tenant_id`);
                        }
                    } catch (error) {
                        // Table might not exist
                        continue;
                    }
                }
            }
        } catch (error) {
            // Ignore if tenants table doesn't exist
        }
        
        // Log the fixes
        if (fixes.length > 0) {
            try {
                await pool(`
                    INSERT INTO audit_logs (tenant_id, user_email, action, resource_id, details)
                    VALUES (
                        (SELECT id FROM tenants WHERE name = 'Default Tenant' LIMIT 1),
                        'system@botinteligente.com',
                        'DATA_INTEGRITY_FIX',
                        'auto_fix',
                        $1
                    )
                `, [JSON.stringify({ fixes, timestamp: new Date().toISOString() })]);
            } catch (error) {
                // Silently fail
            }
        }
        
        return {
            timestamp: new Date().toISOString(),
            fixesApplied: fixes.length,
            fixes: fixes
        };
    }
    
    /**
     * Schedule regular integrity checks
     * @param {number} intervalMinutes - Check interval in minutes
     */
    scheduleChecks(intervalMinutes = 60) {
        setInterval(async () => {
            console.log(`Running scheduled data integrity checks at ${new Date().toISOString()}`);
            const results = await this.runAllChecks();
            
            const criticalCount = results.filter(r => r.status === 'critical').length;
            if (criticalCount > 0) {
                console.error(`Found ${criticalCount} critical data integrity issues`);
                // TODO: Send alert notification
            }
        }, intervalMinutes * 60 * 1000);
    }
}

// Export singleton instance
const monitor = new DataIntegrityMonitor();

export { DataIntegrityMonitor, IntegrityCheckResult, monitor };

export default monitor;
