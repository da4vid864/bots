// services/scoringService.js
const pool = require('./db');

/**
 * Obtiene las reglas de scoring activas para un bot
 */
async function getScoringRules(botId) {
    try {
        const result = await pool.query(
            'SELECT * FROM scoring_rules WHERE bot_id = $1 ORDER BY id ASC',
            [botId]
        );
        return result.rows;
    } catch (error) {
        console.error(`Error obteniendo reglas de scoring para bot ${botId}:`, error);
        return [];
    }
}

/**
 * Evalúa un mensaje contra las reglas de scoring
 * Retorna: { scoreDelta: number, tags: string[], responses: string[] }
 */
async function evaluateMessage(botId, messageText) {
    const result = {
        scoreDelta: 0,
        tags: [],
        responses: []
    };

    if (!messageText) return result;

    const rules = await getScoringRules(botId);
    const normalizedMessage = messageText.toLowerCase();

    for (const rule of rules) {
        let isMatch = false;
        const keyword = rule.keyword.toLowerCase();

        if (rule.match_type === 'exact') {
            isMatch = normalizedMessage === keyword;
        } else if (rule.match_type === 'regex') {
            try {
                const regex = new RegExp(rule.keyword, 'i');
                isMatch = regex.test(messageText);
            } catch (e) {
                console.error(`Regex inválido en regla ${rule.id}:`, e);
            }
        } else {
            // Default: contains
            isMatch = normalizedMessage.includes(keyword);
        }

        if (isMatch) {
            result.scoreDelta += rule.points;
            
            if (rule.tag_to_add) {
                result.tags.push(rule.tag_to_add);
            }
            
            if (rule.response_message) {
                result.responses.push(rule.response_message);
            }
        }
    }

    return result;
}

/**
 * Aplica el resultado del scoring a un lead
 */
async function applyScoring(leadId, evaluationResult) {
    if (evaluationResult.scoreDelta === 0 && evaluationResult.tags.length === 0) {
        return null;
    }

    try {
        // 1. Obtener lead actual para ver sus tags
        const leadRes = await pool.query('SELECT tags, score FROM leads WHERE id = $1', [leadId]);
        if (leadRes.rows.length === 0) return null;
        
        const currentLead = leadRes.rows[0];
        const currentTags = currentLead.tags || [];
        
        // 2. Calcular nuevos valores
        const newScore = (currentLead.score || 0) + evaluationResult.scoreDelta;
        
        // Merge tags únicos
        const newTags = [...new Set([...currentTags, ...evaluationResult.tags])];

        // 3. Actualizar DB
        const updateRes = await pool.query(
            'UPDATE leads SET score = $1, tags = $2 WHERE id = $3 RETURNING *',
            [newScore, newTags, leadId]
        );

        return updateRes.rows[0];
    } catch (error) {
        console.error(`Error aplicando scoring a lead ${leadId}:`, error);
        return null;
    }
}

/**
 * Crea una nueva regla de scoring
 */
async function createScoringRule(botId, ruleData) {
    const { keyword, match_type, points, response_message, tag_to_add } = ruleData;
    
    const result = await pool.query(
        `INSERT INTO scoring_rules
        (bot_id, keyword, match_type, points, response_message, tag_to_add, tenant_id)
        VALUES ($1, $2, $3, $4, $5, $6, current_setting('app.current_tenant')::uuid)
        RETURNING *`,
        [botId, keyword, match_type || 'contains', points || 0, response_message, tag_to_add]
    );
    
    return result.rows[0];
}

/**
 * Elimina una regla de scoring
 */
async function deleteScoringRule(ruleId, botId) {
    await pool.query(
        'DELETE FROM scoring_rules WHERE id = $1 AND bot_id = $2',
        [ruleId, botId]
    );
}

module.exports = {
    getScoringRules,
    evaluateMessage,
    applyScoring,
    createScoringRule,
    deleteScoringRule
};