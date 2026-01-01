// services/complianceService.js
import { query as db } from './db.js';

/**
 * Creates a new privacy request
 * @param {string} tenantId - The ID of the tenant
 * @param {string} requesterEmail - The email of the requester
 * @param {string} type - 'ACCESS', 'DELETE', 'RECTIFY', 'OPPOSE'
 * @param {object} details - JSON details about the request
 * @returns {Promise<object>} Created request
 */
async function createPrivacyRequest(tenantId, requesterEmail, type, details) {
  const query = `
    INSERT INTO privacy_requests (tenant_id, requester_email, request_type, status, details)
    VALUES ($1, $2, $3, 'PENDING', $4)
    RETURNING *
  `;
  const values = [tenantId, requesterEmail, type, details];
  const result = await db(query, values);
  return result.rows[0];
}

/**
 * Get privacy requests
 * @param {string} tenantId - The ID of the tenant
 * @param {string} [status] - Optional status filter
 * @param {string} [requesterEmail] - Optional email filter (for users seeing their own requests)
 * @returns {Promise<Array>} List of requests
 */
async function getPrivacyRequests(tenantId, status = null, requesterEmail = null) {
  let query = `SELECT * FROM privacy_requests WHERE tenant_id = $1`;
  const values = [tenantId];
  let paramCount = 1;

  if (status) {
    paramCount++;
    query += ` AND status = $${paramCount}`;
    values.push(status);
  }

  if (requesterEmail) {
    paramCount++;
    query += ` AND requester_email = $${paramCount}`;
    values.push(requesterEmail);
  }

  query += ` ORDER BY created_at DESC`;

  const result = await db(query, values);
  return result.rows;
}

/**
 * Get a single privacy request by ID
 * @param {string} requestId 
 * @param {string} tenantId 
 */
async function getPrivacyRequestById(requestId, tenantId) {
    const query = `SELECT * FROM privacy_requests WHERE id = $1 AND tenant_id = $2`;
    const result = await db(query, [requestId, tenantId]);
    return result.rows[0];
}

/**
 * Log an audit entry
 * @param {string} tenantId 
 * @param {string} userEmail 
 * @param {string} action 
 * @param {object} details 
 * @param {string} [resourceId] 
 * @param {string} [ipAddress] 
 * @param {string} [userAgent] 
 */
async function logAudit(tenantId, userEmail, action, details, resourceId = null, ipAddress = null, userAgent = null) {
  const query = `
    INSERT INTO audit_logs (tenant_id, user_email, action, details, resource_id, ip_address, user_agent)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  const values = [tenantId, userEmail, action, details, resourceId, ipAddress, userAgent];
  try {
      await db(query, values);
  } catch (err) {
      console.error('Failed to write audit log:', err);
      // We don't throw here to avoid failing the main operation if logging fails
  }
}

/**
 * Process a privacy request (Admin Action)
 * @param {string} requestId 
 * @param {string} tenantId
 * @param {string} action - 'APPROVE', 'REJECT'
 * @param {object} [resultData] - Data to attach if export, or details
 */
async function processPrivacyRequest(requestId, tenantId, action, resultData = {}) {
    // 1. Get the request
    const request = await getPrivacyRequestById(requestId, tenantId);
    if (!request) {
        throw new Error('Request not found');
    }

    if (request.status !== 'PENDING' && request.status !== 'PROCESSING') {
        throw new Error(`Request is already ${request.status}`);
    }

    let newStatus = request.status;
    let resolvedAt = null;

    if (action === 'REJECT') {
        newStatus = 'REJECTED';
        resolvedAt = new Date();
    } else if (action === 'APPROVE') {
        newStatus = 'COMPLETED'; 
        resolvedAt = new Date();

        // Perform logic based on request_type
        // For 'ACCESS' (Data Export), we might generate a JSON export of their data
        if (request.request_type === 'ACCESS') {
            // In a real implementation, this would gather data from users, leads, etc.
            // For now, we assume the admin or system has generated the data or we schedule a job.
            // If resultData contains the export url or data, we save it.
        }
        
        // For 'DELETE' (Right to be Forgotten)
        if (request.request_type === 'DELETE') {
            // Logic to anonymize or delete user data
            // This might trigger a background job or be done immediately
        }
    }

    const query = `
        UPDATE privacy_requests 
        SET status = $1, resolved_at = $2, details = details || $3
        WHERE id = $4 AND tenant_id = $5
        RETURNING *
    `;
    
    // Merge existing details with new resultData
    const updateDetails = { ...resultData, processed_at: new Date().toISOString() };
    
    const result = await db(query, [newStatus, resolvedAt, JSON.stringify(updateDetails), requestId, tenantId]);
    return result.rows[0];
}

export {
  createPrivacyRequest,
  getPrivacyRequests,
  getPrivacyRequestById,
  processPrivacyRequest,
  logAudit
};

export default {
  createPrivacyRequest,
  getPrivacyRequests,
  getPrivacyRequestById,
  processPrivacyRequest,
  logAudit
};
