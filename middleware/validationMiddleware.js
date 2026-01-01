/**
 * Input Validation and Sanitization Middleware
 * 
 * Provides comprehensive validation for all API endpoints to prevent
 * SQL injection, XSS, and data corruption in the WhatsApp bot system.
 */

import { validationSchemas, validateTransactionData } from '../services/transactionUtils.js';

/**
 * Sanitize input to prevent XSS and injection attacks
 * @param {any} value - Input value to sanitize
 * @param {string} type - Type of sanitization ('text', 'html', 'email', 'phone', 'number')
 * @returns {any} - Sanitized value
 */
function sanitizeInput(value, type = 'text') {
    if (value === undefined || value === null) {
        return value;
    }
    
    if (typeof value === 'string') {
        let sanitized = value.trim();
        
        switch (type) {
            case 'html':
                // Remove script tags and dangerous attributes
                sanitized = sanitized
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                    .replace(/on\w+="[^"]*"/gi, '')
                    .replace(/javascript:/gi, '');
                break;
                
            case 'email':
                sanitized = sanitized.toLowerCase();
                // Remove any characters that aren't valid in email
                sanitized = sanitized.replace(/[^\w@._+-]/g, '');
                break;
                
            case 'phone':
                // Keep only digits, plus sign, and parentheses for phone numbers
                sanitized = sanitized.replace(/[^\d+()\s-]/g, '');
                break;
                
            case 'number':
                // For numeric strings, keep only digits and decimal point
                sanitized = sanitized.replace(/[^\d.-]/g, '');
                break;
                
            case 'text':
            default:
                // Escape HTML entities for text
                sanitized = sanitized
                    .replace(/&/g, '&')
                    .replace(/</g, '<')
                    .replace(/>/g, '>')
                    .replace(/"/g, '"')
                    .replace(/'/g, '&#x27;')
                    .replace(/\//g, '&#x2F;');
                break;
        }
        
        return sanitized;
    }
    
    if (typeof value === 'object' && !Array.isArray(value)) {
        // Recursively sanitize object properties
        const sanitized = {};
        for (const [key, val] of Object.entries(value)) {
            sanitized[key] = sanitizeInput(val, type);
        }
        return sanitized;
    }
    
    if (Array.isArray(value)) {
        return value.map(item => sanitizeInput(item, type));
    }
    
    return value;
}

/**
 * Validate request body against a schema
 * @param {Object} schema - Validation schema
 * @returns {Function} - Express middleware
 */
function validateBody(schema) {
    return (req, res, next) => {
        try {
            // Sanitize all inputs first
            req.body = sanitizeInput(req.body, 'text');
            req.query = sanitizeInput(req.query, 'text');
            req.params = sanitizeInput(req.params, 'text');
            
            // Validate against schema
            validateTransactionData(req.body, schema);
            
            next();
        } catch (error) {
            res.status(400).json({
                error: 'Validation Error',
                message: error.message,
                details: error.details || {}
            });
        }
    };
}

/**
 * Validate request query parameters
 * @param {Object} schema - Validation schema for query params
 * @returns {Function} - Express middleware
 */
function validateQuery(schema) {
    return (req, res, next) => {
        try {
            req.query = sanitizeInput(req.query, 'text');
            validateTransactionData(req.query, schema);
            next();
        } catch (error) {
            res.status(400).json({
                error: 'Query Validation Error',
                message: error.message
            });
        }
    };
}

/**
 * Validate UUID parameters
 * @param {string} paramName - Name of the parameter to validate
 * @returns {Function} - Express middleware
 */
function validateUUID(paramName) {
    return (req, res, next) => {
        const uuid = req.params[paramName] || req.body[paramName] || req.query[paramName];
        
        if (!uuid) {
            return next(); // Parameter not required, skip validation
        }
        
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        if (!uuidRegex.test(uuid)) {
            return res.status(400).json({
                error: 'Invalid UUID',
                message: `${paramName} must be a valid UUID format`
            });
        }
        
        next();
    };
}

/**
 * Validate email format
 * @param {string} fieldName - Name of the field containing email
 * @returns {Function} - Express middleware
 */
function validateEmail(fieldName = 'email') {
    return (req, res, next) => {
        const email = req.body[fieldName] || req.query[fieldName];
        
        if (!email) {
            return next(); // Email not required, skip validation
        }
        
        const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Invalid Email',
                message: `${fieldName} must be a valid email address`
            });
        }
        
        next();
    };
}

/**
 * Validate WhatsApp number format (E.164)
 * @param {string} fieldName - Name of the field containing phone number
 * @returns {Function} - Express middleware
 */
function validateWhatsAppNumber(fieldName = 'whatsapp_number') {
    return (req, res, next) => {
        const phone = req.body[fieldName] || req.query[fieldName];
        
        if (!phone) {
            return next(); // Phone not required, skip validation
        }
        
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({
                error: 'Invalid WhatsApp Number',
                message: `${fieldName} must be in E.164 format (e.g., +521234567890)`
            });
        }
        
        next();
    };
}

/**
 * Prevent SQL injection by validating and escaping SQL keywords
 * @param {string} fieldName - Name of the field to check
 * @returns {Function} - Express middleware
 */
function preventSQLInjection(fieldName) {
    return (req, res, next) => {
        const value = req.body[fieldName] || req.query[fieldName] || req.params[fieldName];
        
        if (value && typeof value === 'string') {
            // Check for common SQL injection patterns
            const sqlKeywords = [
                'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'UNION', 'OR', 'AND',
                'EXEC', 'EXECUTE', 'TRUNCATE', 'CREATE', 'ALTER', 'GRANT', 'REVOKE'
            ];
            
            const upperValue = value.toUpperCase();
            
            for (const keyword of sqlKeywords) {
                // Check for keyword followed by space or special characters
                const pattern = new RegExp(`\\b${keyword}\\b`, 'i');
                if (pattern.test(value)) {
                    return res.status(400).json({
                        error: 'Potential SQL Injection Detected',
                        message: `Field ${fieldName} contains potentially dangerous content`
                    });
                }
            }
            
            // Check for comment sequences
            if (value.includes('--') || value.includes('/*') || value.includes('*/')) {
                return res.status(400).json({
                    error: 'Potential SQL Injection Detected',
                    message: `Field ${fieldName} contains SQL comment sequences`
                });
            }
            
            // Check for semicolon (statement termination)
            if (value.includes(';')) {
                return res.status(400).json({
                    error: 'Potential SQL Injection Detected',
                    message: `Field ${fieldName} contains statement termination character`
                });
            }
        }
        
        next();
    };
}

/**
 * Validate file uploads (MIME types and size)
 * @param {Object} options - Validation options
 * @param {Array<string>} options.allowedTypes - Allowed MIME types
 * @param {number} options.maxSize - Maximum file size in bytes
 * @returns {Function} - Express middleware
 */
function validateFileUpload(options = {}) {
    const {
        allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
        maxSize = 5 * 1024 * 1024 // 5MB default
    } = options;
    
    return (req, res, next) => {
        if (!req.file && !req.files) {
            return next();
        }
        
        const files = req.file ? [req.file] : (req.files ? Object.values(req.files).flat() : []);
        
        for (const file of files) {
            // Check file size
            if (file.size > maxSize) {
                return res.status(400).json({
                    error: 'File Too Large',
                    message: `File ${file.originalname} exceeds maximum size of ${maxSize / (1024 * 1024)}MB`
                });
            }
            
            // Check MIME type
            if (!allowedTypes.includes(file.mimetype)) {
                return res.status(400).json({
                    error: 'Invalid File Type',
                    message: `File ${file.originalname} has invalid type. Allowed: ${allowedTypes.join(', ')}`
                });
            }
            
            // Check file extension matches MIME type
            const extension = file.originalname.split('.').pop().toLowerCase();
            const validExtensions = {
                'image/jpeg': ['jpg', 'jpeg'],
                'image/png': ['png'],
                'image/gif': ['gif'],
                'application/pdf': ['pdf']
            };
            
            if (validExtensions[file.mimetype] && !validExtensions[file.mimetype].includes(extension)) {
                return res.status(400).json({
                    error: 'File Extension Mismatch',
                    message: `File ${file.originalname} extension doesn't match its MIME type`
                });
            }
        }
        
        next();
    };
}

/**
 * Rate limiting middleware to prevent abuse
 * @param {Object} options - Rate limiting options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.maxRequests - Maximum requests per window
 * @returns {Function} - Express middleware
 */
function rateLimit(options = {}) {
    const {
        windowMs = 15 * 60 * 1000, // 15 minutes
        maxRequests = 100
    } = options;
    
    const requests = new Map();
    
    return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        
        if (!requests.has(ip)) {
            requests.set(ip, []);
        }
        
        const timestamps = requests.get(ip);
        
        // Remove timestamps outside the window
        while (timestamps.length > 0 && timestamps[0] <= now - windowMs) {
            timestamps.shift();
        }
        
        // Check if rate limit exceeded
        if (timestamps.length >= maxRequests) {
            return res.status(429).json({
                error: 'Too Many Requests',
                message: `Rate limit exceeded. Please try again in ${Math.ceil(windowMs / 60000)} minutes.`
            });
        }
        
        // Add current timestamp
        timestamps.push(now);
        
        // Set headers
        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', maxRequests - timestamps.length);
        res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());
        
        next();
    };
}

/**
 * Common validation schemas for reuse
 */
const commonSchemas = {
    createLead: validationSchemas.lead,
    updateLead: {
        ...validationSchemas.lead,
        whatsapp_number: { required: false, pattern: /^\+[1-9]\d{1,14}$/ }
    },
    createUser: validationSchemas.user,
    createBot: validationSchemas.bot
};

export {
    sanitizeInput,
    validateBody,
    validateQuery,
    validateUUID,
    validateEmail,
    validateWhatsAppNumber,
    preventSQLInjection,
    validateFileUpload,
    rateLimit,
    commonSchemas
};