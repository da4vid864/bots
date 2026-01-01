import complianceService from '../services/complianceService.js';

/**
 * Submit a new privacy request
 */
async function submitRequest(req, res) {
  try {
    const { type, details } = req.body;
    
    // Determine the requester email. 
    // If authenticated user, use their email. 
    // If public endpoint (unlikely for this route as defined in authMiddleware), use body param but verify?
    // For now we assume req.user exists (Auth middleware)
    const requesterEmail = req.user.email;
    const tenantId = req.tenantId; // From tenantMiddleware

    if (!['ACCESS', 'DELETE', 'RECTIFY', 'OPPOSE'].includes(type)) {
      return res.status(400).json({ message: 'Invalid request type' });
    }

    const request = await complianceService.createPrivacyRequest(tenantId, requesterEmail, type, details || {});
    
    // Log audit
    await complianceService.logAudit(
        tenantId, 
        req.user.email, 
        'CREATE_PRIVACY_REQUEST', 
        { requestId: request.id, type }, 
        request.id,
        req.ip,
        req.headers['user-agent']
    );

    res.status(201).json(request);
  } catch (error) {
    console.error('Error submitting privacy request:', error);
    res.status(500).json({ message: 'Error submitting request' });
  }
}

/**
 * List requests
 */
async function listRequests(req, res) {
  try {
    const tenantId = req.tenantId;
    const { status } = req.query;
    
    // If Admin, can see all requests for the tenant
    // If Standard User, can only see their own requests
    let requesterEmail = null;
    if (req.user.role !== 'admin') {
        requesterEmail = req.user.email;
    }

    const requests = await complianceService.getPrivacyRequests(tenantId, status, requesterEmail);
    res.json(requests);
  } catch (error) {
    console.error('Error listing privacy requests:', error);
    res.status(500).json({ message: 'Error listing requests' });
  }
}

/**
 * Approve/Reject a request (Admin Only)
 */
async function reviewRequest(req, res) {
    try {
        const { id } = req.params;
        const { action, resultData } = req.body; // action: 'APPROVE' or 'REJECT'
        const tenantId = req.tenantId;

        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        if (!['APPROVE', 'REJECT'].includes(action)) {
            return res.status(400).json({ message: 'Invalid action' });
        }

        const updatedRequest = await complianceService.processPrivacyRequest(id, tenantId, action, resultData);

        // Log audit
        await complianceService.logAudit(
            tenantId, 
            req.user.email, 
            `REVIEW_PRIVACY_REQUEST_${action}`, 
            { requestId: id }, 
            id,
            req.ip,
            req.headers['user-agent']
        );

        res.json(updatedRequest);
    } catch (error) {
        console.error('Error reviewing privacy request:', error);
        res.status(500).json({ message: error.message || 'Error reviewing request' });
    }
}

export {
  submitRequest,
  listRequests,
  reviewRequest
};

export default {
  submitRequest,
  listRequests,
  reviewRequest
};