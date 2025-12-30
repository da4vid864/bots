/**
 * Transaction Utilities for Data Integrity
 * 
 * Provides reusable transaction patterns to ensure ACID compliance
 * for critical data operations in the WhatsApp bot system.
 */

const { pool } = require('./db');

/**
 * Execute a database operation within a transaction
 * @param {Function} operation - Async function that receives a client and performs operations
 * @param {Object} options - Transaction options
 * @param {string} options.isolationLevel - PostgreSQL isolation level (default: 'READ COMMITTED')
 * @param {boolean} options.readOnly - Whether transaction is read-only (default: false)
 * @param {number} options.timeout - Transaction timeout in milliseconds
 * @returns {Promise<any>} - Result of the operation
 */
async function withTransaction(operation, options = {}) {
    const {
        isolationLevel = 'READ COMMITTED',
        readOnly = false,
        timeout = 30000 // 30 seconds default
    } = options;

    const client = await pool.connect();
    
    try {
        // Start transaction with specified isolation level
        await client.query(`BEGIN TRANSACTION ISOLATION LEVEL ${isolationLevel}`);
        
        if (readOnly) {
            await client.query('SET TRANSACTION READ ONLY');
        }
        
        if (timeout) {
            await client.query(`SET LOCAL statement_timeout = ${timeout}`);
        }
        
        // Execute the operation
        const result = await operation(client);
        
        // Commit if successful
        await client.query('COMMIT');
        
        return result;
    } catch (error) {
        // Rollback on any error
        await client.query('ROLLBACK');
        
        // Enhance error with transaction context
        error.message = `Transaction failed: ${error.message}`;
        throw error;
    } finally {
        // Always release the client back to the pool
        client.release();
    }
}

/**
 * Execute multiple operations in a single transaction (batch)
 * @param {Array<Function>} operations - Array of async functions to execute
 * @param {Object} options - Transaction options
 * @returns {Promise<Array>} - Results of all operations in order
 */
async function batchTransaction(operations, options = {}) {
    return withTransaction(async (client) => {
        const results = [];
        for (const operation of operations) {
            const result = await operation(client);
            results.push(result);
        }
        return results;
    }, options);
}

/**
 * Retry a transaction on serialization failure (for SERIALIZABLE isolation)
 * @param {Function} operation - Async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum retry attempts (default: 3)
 * @param {number} options.baseDelay - Base delay in ms for exponential backoff (default: 100)
 * @returns {Promise<any>} - Result of the operation
 */
async function retryOnSerializationFailure(operation, options = {}) {
    const {
        maxRetries = 3,
        baseDelay = 100
    } = options;
    
    let lastError;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            
            // Check if it's a serialization failure (PostgreSQL error code 40001)
            if (error.code === '40001' || error.message.includes('serialization')) {
                // Exponential backoff
                const delay = baseDelay * Math.pow(2, attempt);
                console.warn(`Serialization failure, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            
            // Not a serialization failure, rethrow immediately
            throw error;
        }
    }
    
    // Max retries exceeded
    throw new Error(`Transaction failed after ${maxRetries} retries: ${lastError.message}`);
}

/**
 * Create a savepoint within a transaction for partial rollback
 * @param {Object} client - PostgreSQL client
 * @param {string} savepointName - Name of the savepoint
 * @returns {Function} - Function to rollback to this savepoint
 */
function createSavepoint(client, savepointName) {
    let created = false;
    
    return {
        async set() {
            await client.query(`SAVEPOINT ${savepointName}`);
            created = true;
        },
        
        async rollback() {
            if (created) {
                await client.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
                created = false;
            }
        },
        
        async release() {
            if (created) {
                await client.query(`RELEASE SAVEPOINT ${savepointName}`);
                created = false;
            }
        }
    };
}

/**
 * Validate data before transaction to prevent constraint violations
 * @param {Object} data - Data to validate
 * @param {Object} schema - Validation schema
 * @throws {Error} - If validation fails
 */
function validateTransactionData(data, schema) {
    const errors = [];
    
    for (const [field, rules] of Object.entries(schema)) {
        const value = data[field];
        
        if (rules.required && (value === undefined || value === null || value === '')) {
            errors.push(`${field} is required`);
        }
        
        if (value !== undefined && value !== null) {
            if (rules.type && typeof value !== rules.type) {
                errors.push(`${field} must be ${rules.type}`);
            }
            
            if (rules.minLength && value.length < rules.minLength) {
                errors.push(`${field} must be at least ${rules.minLength} characters`);
            }
            
            if (rules.maxLength && value.length > rules.maxLength) {
                errors.push(`${field} must be at most ${rules.maxLength} characters`);
            }
            
            if (rules.pattern && !rules.pattern.test(value)) {
                errors.push(`${field} has invalid format`);
            }
            
            if (rules.enum && !rules.enum.includes(value)) {
                errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
            }
        }
    }
    
    if (errors.length > 0) {
        throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
}

/**
 * Common validation schemas for transaction data
 */
const validationSchemas = {
    lead: {
        whatsapp_number: {
            required: true,
            pattern: /^\+[1-9]\d{1,14}$/
        },
        name: {
            required: true,
            minLength: 2,
            maxLength: 100
        },
        email: {
            required: false,
            pattern: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
        },
        score: {
            required: false,
            type: 'number',
            min: 0,
            max: 100
        }
    },
    
    user: {
        email: {
            required: true,
            pattern: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
        },
        name: {
            required: true,
            minLength: 2,
            maxLength: 100
        }
    },
    
    bot: {
        name: {
            required: true,
            minLength: 2,
            maxLength: 100
        },
        status: {
            required: true,
            enum: ['active', 'inactive', 'paused']
        }
    }
};

/**
 * Audit log helper for transactions
 * @param {Object} client - PostgreSQL client
 * @param {string} action - Action performed
 * @param {string} resourceType - Type of resource affected
 * @param {string} resourceId - ID of resource affected
 * @param {Object} details - Additional details
 * @param {string} userEmail - Email of user performing action
 */
async function logTransactionAudit(client, action, resourceType, resourceId, details = {}, userEmail = 'system') {
    try {
        // Get current tenant from app context
        const tenantResult = await client.query("SELECT current_setting('app.current_tenant', true) as tenant_id");
        const tenantId = tenantResult.rows[0]?.tenant_id;
        
        if (tenantId) {
            await client.query(
                `INSERT INTO audit_logs (tenant_id, user_email, action, resource_id, resource_type, details)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [tenantId, userEmail, action, resourceId, resourceType, JSON.stringify(details)]
            );
        }
    } catch (error) {
        // Don't fail transaction if audit logging fails
        console.error('Failed to log transaction audit:', error.message);
    }
}

module.exports = {
    withTransaction,
    batchTransaction,
    retryOnSerializationFailure,
    createSavepoint,
    validateTransactionData,
    validationSchemas,
    logTransactionAudit
};