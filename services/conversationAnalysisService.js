/**
 * Conversation Analysis Service
 * Analyzes WhatsApp bot conversations to extract leads and insights
 * 
 * Phase 1: Core Analysis Engine
 */

import { query } from './db.js';
import { classifyIntent } from './intentClassificationService.js';
import { extractProducts } from './productExtractionService.js';
import { calculateInterestScore } from './interestScoringService.js';
import { predictStage } from './stagePredictionService.js';
import { generateFollowupRecommendations } from './followupService.js';

/**
 * Get tenant ID from database context
 * @returns {Promise<string>} Tenant UUID
 */
async function getCurrentTenantId() {
    const result = await query(
        "SELECT current_setting('app.current_tenant', true)::uuid as tenant_id"
    );
    return result.rows[0]?.tenant_id;
}

/**
 * Conversation Analysis Service
 * Analyzes WhatsApp bot conversations to extract leads and insights
 */
class ConversationAnalysisService {
    
    /**
     * Analyze a single conversation for a contact
     * @param {string} botId - Bot UUID
     * @param {string} contactPhone - Contact phone number
     * @param {Object} options - Analysis options
     * @returns {Promise<Object>} Analysis result
     */
    async analyzeConversation(botId, contactPhone, options = {}) {
        const {
            startDate = null,
            endDate = null,
            includeMessages = true
        } = options;
        
        try {
            const tenantId = await getCurrentTenantId();
            
            if (!tenantId) {
                throw new Error('Tenant context not available');
            }
            
            // 1. Fetch all messages for this conversation
            const messages = await this.getConversationMessages(
                botId, 
                tenantId,
                contactPhone, 
                startDate, 
                endDate
            );
            
            if (messages.length === 0) {
                return { success: false, error: 'No messages found' };
            }
            
            // 2. Aggregate conversation data
            const conversationData = this.aggregateConversationData(messages);
            
            // 3. Run analysis pipeline
            const intentResult = classifyIntent(conversationData);
            const productResult = extractProducts(conversationData);
            const interestResult = calculateInterestScore(conversationData, intentResult, productResult);
            const stageResult = predictStage(conversationData, intentResult, interestResult);
            const followupResult = generateFollowupRecommendations(conversationData, interestResult, stageResult);
            
            // 4. Create analysis record
            const analysis = await this.saveAnalysis(botId, tenantId, contactPhone, {
                ...conversationData,
                intent: intentResult,
                products: productResult,
                interest: interestResult,
                stage: stageResult,
                followup: followupResult
            });
            
            // 5. Update or create lead contact record
            await this.updateLeadContact(botId, tenantId, contactPhone, analysis);
            
            // 6. Update pipeline if lead qualifies (score >= 50)
            if (interestResult.score >= 50) {
                await this.syncToPipeline(botId, tenantId, contactPhone, analysis);
            }
            
            return {
                success: true,
                analysis,
                messagesCount: messages.length
            };
            
        } catch (error) {
            console.error('Error analyzing conversation:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Get all messages for a conversation
     */
    async getConversationMessages(botId, tenantId, contactPhone, startDate, endDate) {
        let sql = `
            SELECT 
                id, message_direction, message_type, message_content,
                message_timestamp, message_index
            FROM conversation_messages
            WHERE bot_id = $1 AND tenant_id = $2 AND contact_phone = $3
        `;
        const params = [botId, tenantId, contactPhone];
        
        if (startDate) {
            sql += ` AND message_timestamp >= $${params.length + 1}`;
            params.push(startDate);
        }
        if (endDate) {
            sql += ` AND message_timestamp <= $${params.length + 1}`;
            params.push(endDate);
        }
        
        sql += ` ORDER BY message_index ASC`;
        
        const result = await query(sql, params);
        return result.rows;
    }
    
    /**
     * Aggregate conversation data for analysis
     * @param {Array} messages - Array of message objects
     * @returns {Object} Aggregated conversation data
     */
    aggregateConversationData(messages) {
        const inboundMessages = messages.filter(m => m.message_direction === 'inbound');
        const outboundMessages = messages.filter(m => m.message_direction === 'outbound');
        
        // Extract all text content
        const allText = messages
            .filter(m => m.message_type === 'text')
            .map(m => m.message_content)
            .join(' ');
        
        // Calculate metrics
        const totalMessages = messages.length;
        const uniqueDays = new Set(
            messages.map(m => new Date(m.message_timestamp).toDateString())
        ).size;
        
        // Find first and last contact
        const sortedByTime = [...messages].sort(
            (a, b) => new Date(a.message_timestamp) - new Date(b.message_timestamp)
        );
        
        // Check for common question patterns
        const lowerText = allText.toLowerCase();
        const hasQuestions = allText.includes('?') || 
                            lowerText.includes('como') ||
                            lowerText.includes('cuanto') ||
                            lowerText.includes('donde') ||
                            lowerText.includes('qué') ||
                            lowerText.includes('cuando') ||
                            lowerText.includes('how') ||
                            lowerText.includes('what') ||
                            lowerText.includes('when');
        
        const hasPriceInquiry = lowerText.includes('precio') ||
                               lowerText.includes('costo') ||
                               lowerText.includes('cuanto cuesta') ||
                               lowerText.includes('price') ||
                               lowerText.includes('cost');
        
        return {
            totalMessages,
            inboundCount: inboundMessages.length,
            outboundCount: outboundMessages.length,
            conversationLength: allText.length,
            uniqueContactDays: uniqueDays,
            firstMessageAt: sortedByTime[0]?.message_timestamp,
            lastMessageAt: sortedByTime[sortedByTime.length - 1]?.message_timestamp,
            allText,
            messages: messages,
            hasQuestions,
            hasPriceInquiry,
            contactName: null
        };
    }
    
    /**
     * Save analysis to database
     */
    async saveAnalysis(botId, tenantId, contactPhone, analysisData) {
        const {
            totalMessages,
            conversationLength,
            intent,
            products,
            interest,
            stage,
            followup,
            firstMessageAt,
            lastMessageAt,
            contactName
        } = analysisData;
        
        const sql = `
            INSERT INTO conversation_analysis (
                bot_id, tenant_id, contact_phone, contact_name,
                primary_intent, intent_confidence, intent_evidence,
                interest_score, buying_signals, risk_signals, sentiment_score,
                products_mentioned, services_mentioned, price_inquiries,
                predicted_stage, stage_confidence, stage_indicators,
                recommended_followup, followup_priority, suggested_actions,
                conversation_length, message_count, is_complete_conversation
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
            RETURNING *
        `;
        
        const params = [
            botId, tenantId, contactPhone, contactName || null,
            intent.primary, intent.confidence, JSON.stringify(intent.evidence || {}),
            interest.score,
            JSON.stringify(interest.buyingSignals || []),
            JSON.stringify(interest.riskSignals || []),
            interest.sentiment,
            JSON.stringify(products.products || []),
            JSON.stringify(products.services || []),
            JSON.stringify(products.priceInquiries || []),
            stage.stage, stage.confidence,
            JSON.stringify(stage.indicators || {}),
            followup.recommendedTime, followup.priority,
            JSON.stringify(followup.actions || []),
            conversationLength, totalMessages, true
        ];
        
        const result = await query(sql, params);
        return result.rows[0];
    }
    
    /**
     * Update lead contact record
     */
    async updateLeadContact(botId, tenantId, contactPhone, analysis) {
        const sql = `
            INSERT INTO lead_contacts (
                bot_id, tenant_id, contact_phone, contact_name,
                total_conversations, total_messages,
                first_contact_at, last_contact_at,
                avg_interest_score, dominant_intent,
                products_of_interest, last_stage_prediction,
                is_qualified_lead, qualification_score, needs_review
            ) VALUES ($1, $2, $3, $4, 1, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            ON CONFLICT (bot_id, tenant_id, contact_phone)
            DO UPDATE SET
                total_conversations = lead_contacts.total_conversations + 1,
                total_messages = lead_contacts.total_messages + $5,
                last_contact_at = GREATEST(lead_contacts.last_contact_at, $7),
                avg_interest_score = (
                    (COALESCE(lead_contacts.avg_interest_score, $8) * lead_contacts.total_conversations + $8) /
                    (lead_contacts.total_conversations + 1)
                ),
                last_stage_prediction = $11,
                is_qualified_lead = $12,
                qualification_score = $13,
                needs_review = $14,
                updated_at = NOW()
            RETURNING *
        `;
        
        const params = [
            botId, tenantId, contactPhone, analysis.contactName || null,
            analysis.totalMessages,
            analysis.firstMessageAt, analysis.lastMessageAt,
            analysis.interest.score, analysis.intent.primary,
            JSON.stringify([...new Set([
                ...(analysis.products.products || []).map(p => p.name),
                ...(analysis.products.services || []).map(s => s.name)
            ])]),
            analysis.stage.stage,
            analysis.interest.score >= 50,
            analysis.interest.score,
            analysis.interest.score >= 30 && analysis.interest.score < 50
        ];
        
        const result = await query(sql, params);
        return result.rows[0];
    }
    
    /**
     * Sync qualified lead to sales pipeline
     */
    async syncToPipeline(botId, tenantId, contactPhone, analysis) {
        try {
            const { createLead, getLeads } = await import('./leadService.js');
            const existingLeads = await getLeads({ bot_id: botId, search: contactPhone });
            
            if (existingLeads.leads && existingLeads.leads.length > 0) {
                return existingLeads.leads[0];
            }
            
            const lead = await createLead({
                bot_id: botId,
                contact_phone: contactPhone,
                contact_name: analysis.contactName || null,
                source: 'conversation_analysis',
                tags: ['from-conversation-analysis', analysis.intent.primary]
            });
            
            return lead;
        } catch (error) {
            console.error('Error syncing to pipeline:', error);
            return null;
        }
    }
    
    /**
     * Batch analyze all conversations for a bot
     */
    async batchAnalyze(botId, options = {}) {
        const { jobType = 'full', dateFrom = null, dateTo = null, createdBy = null } = options;
        
        try {
            const tenantId = await getCurrentTenantId();
            
            const jobSql = `
                INSERT INTO analysis_jobs (bot_id, tenant_id, job_type, status, date_from, date_to, created_by)
                VALUES ($1, $2, $3, 'pending', $4, $5, $6)
                RETURNING id
            `;
            const jobResult = await query(jobSql, [botId, tenantId, jobType, dateFrom, dateTo, createdBy]);
            const jobId = jobResult.rows[0].id;
            
            let contactsSql = `
                SELECT DISTINCT cm.contact_phone, lc.contact_name
                FROM conversation_messages cm
                LEFT JOIN lead_contacts lc ON cm.bot_id = lc.bot_id 
                    AND cm.tenant_id = lc.tenant_id AND cm.contact_phone = lc.contact_phone
                WHERE cm.bot_id = $1 AND cm.tenant_id = $2
            `;
            const contactParams = [botId, tenantId];
            
            if (dateFrom) {
                contactsSql += ` AND cm.message_timestamp >= $${contactParams.length + 1}`;
                contactParams.push(dateFrom);
            }
            if (dateTo) {
                contactsSql += ` AND cm.message_timestamp <= $${contactParams.length + 1}`;
                contactParams.push(dateTo);
            }
            
            const contactsResult = await query(contactsSql, contactParams);
            
            await query(`UPDATE analysis_jobs SET total_contacts = $1 WHERE id = $2`,
                [contactsResult.rows.length, jobId]);
            
            await query(`UPDATE analysis_jobs SET status = 'processing', started_at = NOW() WHERE id = $1`,
                [jobId]);
            
            let processed = 0, failed = 0;
            const errors = [];
            
            for (const contact of contactsResult.rows) {
                try {
                    const result = await this.analyzeConversation(botId, contact.contact_phone, {
                        startDate: dateFrom, endDate: dateTo
                    });
                    if (result.success) processed++; else { failed++; errors.push({ contact: contact.contact_phone, error: result.error }); }
                } catch (error) {
                    failed++; errors.push({ contact: contact.contact_phone, error: error.message });
                }
                
                await query(`UPDATE analysis_jobs SET processed_contacts = $1, failed_contacts = $2, current_contact = $3, error_log = $4 WHERE id = $5`,
                    [processed, failed, contact.contact_phone, JSON.stringify(errors), jobId]);
            }
            
            await query(`UPDATE analysis_jobs SET status = 'completed', completed_at = NOW(), results_summary = $1 WHERE id = $2`,
                [JSON.stringify({ processed, failed, total: contactsResult.rows.length }), jobId]);
            
            return { jobId, processed, failed, total: contactsResult.rows.length };
            
        } catch (error) {
            console.error('Error in batch analyze:', error);
            throw error;
        }
    }
    
    async getJobStatus(jobId) {
        const result = await query(`SELECT * FROM analysis_jobs WHERE id = $1`, [jobId]);
        return result.rows[0] || null;
    }
    
    async getContactAnalysisHistory(botId, contactPhone, limit = 10) {
        const tenantId = await getCurrentTenantId();
        const result = await query(
            `SELECT * FROM conversation_analysis
             WHERE bot_id = $1 AND tenant_id = $2 AND contact_phone = $3
             ORDER BY analysis_timestamp DESC LIMIT $4`,
            [botId, tenantId, contactPhone, limit]
        );
        return result.rows;
    }
    
    async getLeadsNeedingFollowup(botId, priority = null) {
        const tenantId = await getCurrentTenantId();
        
        let sql = `
            SELECT lc.*, ca.interest_score, ca.predicted_stage, 
                   ca.recommended_followup, ca.followup_priority, ca.primary_intent
            FROM lead_contacts lc
            LEFT JOIN LATERAL (
                SELECT interest_score, predicted_stage, recommended_followup, 
                       followup_priority, primary_intent
                FROM conversation_analysis
                WHERE bot_id = lc.bot_id AND tenant_id = lc.tenant_id 
                    AND contact_phone = lc.contact_phone
                ORDER BY analysis_timestamp DESC LIMIT 1
            ) ca ON true
            WHERE lc.bot_id = $1 AND lc.tenant_id = $2 
                AND lc.is_qualified_lead = true
                AND (ca.followup_priority IN ('high', 'medium') OR lc.needs_review = true)
        `;
        const params = [botId, tenantId];
        
        if (priority) {
            sql += ` AND ca.followup_priority = $${params.length + 1}`;
            params.push(priority);
        }
        
        sql += ` ORDER BY CASE ca.followup_priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, lc.qualification_score DESC`;
        
        const result = await query(sql, params);
        return result.rows;
    }
}

const conversationAnalysisService = new ConversationAnalysisService();

export default conversationAnalysisService;
export { ConversationAnalysisService };
