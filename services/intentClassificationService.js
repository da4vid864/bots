/**
 * Intent Classification Service
 * Classifies conversation intent based on keyword patterns and NLP
 * 
 * Phase 1: Core Analysis Engine
 */

// Intent patterns with keywords and weights
const INTENT_PATTERNS = {
    purchase: {
        keywords: [
            'comprar', 'quiero', 'necesito', 'precio', 'costo', 'cuanto',
            'cotizar', 'presupuesto', 'pagar', 'factura', 'entrega',
            'comprar', 'compra', 'adquirir',
            'buy', 'purchase', 'price', 'cost', 'how much'
        ],
        weight: 1.0
    },
    inquiry: {
        keywords: [
            'informacion', 'info', 'consulta', 'pregunta', 'datos',
            'acerca', 'sobre', 'como funciona', 'detalles', 'more info',
            'information', 'details', 'about', 'how does it work'
        ],
        weight: 0.9
    },
    support: {
        keywords: [
            'ayuda', 'problema', 'error', 'fallo', 'no funciona',
            'ayuda', 'support', 'help', 'issue', 'problem', 'not working',
            'error', 'bug', 'trouble', 'dificultad'
        ],
        weight: 0.85
    },
    complaint: {
        keywords: [
            'queja', 'reclamo', 'mal', 'peor', 'nunca', 'vergüenza',
            'complaint', 'terrible', 'worst', 'awful', 'unacceptable',
            'insatisfecho', 'molesto', 'frustrado'
        ],
        weight: 0.9
    },
    feedback: {
        keywords: [
            'opinion', 'comentario', 'sugerencia', 'mejorar', 'feedback',
            'opinion', 'suggestion', 'improve', 'review', 'rating'
        ],
        weight: 0.8
    },
    cancellation: {
        keywords: [
            'cancelar', 'anular', 'devolver', 'reembolso', 'no quiero',
            'cancel', 'canceled', 'refund', 'return', 'undo', 'stop'
        ],
        weight: 0.95
    },
    renewal: {
        keywords: [
            'renovar', 'renovacion', 'continuar', 'extender', 'prorroga',
            'renew', 'renewal', 'continue', 'extend', 'subscription',
            'reactivar', 're-contratar'
        ],
        weight: 0.9
    },
    appointment: {
        keywords: [
            'cita', 'reunion', 'visitar', 'horario', 'agendar', 'reservar',
            'appointment', 'meeting', 'schedule', 'visit', 'book',
            'junta', 'encuentro', 'demo'
        ],
        weight: 0.85
    },
    information: {
        keywords: [
            'horario', 'ubicacion', 'direccion', 'telefono', 'contacto',
            'hours', 'location', 'address', 'phone', 'contact', 'where',
            'ubicado', 'donde', 'numero'
        ],
        weight: 0.75
    }
};

/**
 * Classifies the intent of a conversation based on text analysis
 * @param {Object} conversationData - Aggregated conversation data
 * @returns {Object} Intent classification result
 */
export function classifyIntent(conversationData) {
    const { allText, hasQuestions } = conversationData;
    const lowerText = allText.toLowerCase();
    
    // Calculate scores for each intent
    const scores = {};
    
    for (const [intent, config] of Object.entries(INTENT_PATTERNS)) {
        let score = 0;
        for (const keyword of config.keywords) {
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            const matches = lowerText.match(regex);
            if (matches) {
                score += matches.length * config.weight;
            }
        }
        scores[intent] = Math.min(score / 10, 1);
    }
    
    // Find primary intent
    let primaryIntent = 'inquiry';
    let maxScore = 0;
    const evidence = {};
    
    for (const [intent, score] of Object.entries(scores)) {
        if (score > maxScore) {
            maxScore = score;
            primaryIntent = intent;
        }
        evidence[intent] = {
            score: Math.round(score * 10000) / 10000,
            matchedKeywords: getMatchedKeywords(lowerText, INTENT_PATTERNS[intent].keywords)
        };
    }
    
    // Boost score if there are questions
    if (hasQuestions) {
        if (primaryIntent === 'inquiry') {
            scores.inquiry = Math.min(scores.inquiry * 1.2, 1);
        }
        scores.information = Math.min(scores.information * 1.15, 1);
    }
    
    // Detect urgency
    const urgencyPatterns = ['urgente', 'ahora', 'ya', 'hoy', 'inmediatamente', 'urgent', 'asap', 'now', 'today'];
    const hasUrgency = urgencyPatterns.some(p => new RegExp(`\\b${p}\\b`, 'gi').test(lowerText));
    
    if (hasUrgency && (primaryIntent === 'purchase' || primaryIntent === 'inquiry')) {
        maxScore = Math.min(maxScore * 1.1, 1);
    }
    
    const sortedScores = Object.values(scores).sort((a, b) => b - a);
    const scoreGap = sortedScores[0] - (sortedScores[1] || 0);
    const confidence = Math.min(0.5 + scoreGap * 0.4 + maxScore * 0.3, 0.9999);
    
    return {
        primary: primaryIntent,
        confidence: Math.round(confidence * 10000) / 10000,
        allScores: Object.fromEntries(
            Object.entries(scores).map(([k, v]) => [k, Math.round(v * 10000) / 10000])
        ),
        evidence,
        hasQuestions,
        hasUrgency
    };
}

function getMatchedKeywords(text, keywords) {
    const matched = [];
    for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        if (regex.test(text)) {
            matched.push(keyword);
        }
    }
    return matched.slice(0, 10);
}

export default { classifyIntent };
