/**
 * Interest Scoring Service
 * Calculates lead interest score based on multiple factors
 * 
 * Phase 1: Core Analysis Engine
 */

const BUYING_SIGNALS = [
    'comprar', 'quiero', 'necesito', 'ahora', 'ya', 'hoy',
    'precio', 'costo', 'cuanto', 'forma de pago', 'tarjeta',
    'transferencia', 'disponible', 'stock', 'entrega', 'envio',
    'buy', 'purchase', 'now', 'today', 'price', 'payment', 'available'
];

const RISK_SIGNALS = [
    'no se', 'quizás', 'tal vez', 'pienso', 'quizá',
    'otro', 'comparar', 'ver', 'pensar', 'mas tarde',
    'not sure', 'maybe', 'perhaps', 'think', 'later'
];

const POSITIVE_WORDS = [
    'gracias', 'excelente', 'perfecto', 'bien', 'genial',
    'thank', 'great', 'good', 'excellent', 'perfect'
];

const NEGATIVE_WORDS = [
    'mal', 'peor', 'terrible', 'horrible', 'nunca', 'problem',
    'bad', 'worse', 'terrible', 'horrible', 'worst', 'problema'
];

export function calculateInterestScore(conversationData, intentResult, productResult) {
    let score = 0;
    const buyingSignals = [];
    const riskSignals = [];
    const { allText, totalMessages, uniqueContactDays, hasPriceInquiry } = conversationData;
    const lowerText = allText.toLowerCase();
    
    const intentScores = {
        'purchase': 25, 'inquiry': 15, 'appointment': 20, 'renewal': 22,
        'information': 10, 'support': 8, 'complaint': 5, 'cancellation': 3, 'feedback': 12
    };
    
    score += intentScores[intentResult.primary] || 0;
    
    for (const signal of BUYING_SIGNALS) {
        if (new RegExp(`\\b${signal}\\b`, 'gi').test(lowerText)) {
            buyingSignals.push(signal);
        }
    }
    score += Math.min(buyingSignals.length * 2.5, 25);
    
    for (const signal of RISK_SIGNALS) {
        if (new RegExp(`\\b${signal}\\b`, 'gi').test(lowerText)) {
            riskSignals.push(signal);
        }
    }
    score -= Math.min(riskSignals.length * 2, 15);
    
    const productMentions = (productResult.products?.length || 0) + (productResult.services?.length || 0);
    score += Math.min(productMentions * 5, 20);
    
    if (hasPriceInquiry || productResult.priceInquiries?.length > 0) score += 10;
    
    let engagementScore = 0;
    if (totalMessages >= 10) engagementScore = 10;
    else if (totalMessages >= 5) engagementScore = 7;
    else if (totalMessages >= 2) engagementScore = 4;
    if (uniqueContactDays >= 3) engagementScore += 5;
    else if (uniqueContactDays >= 2) engagementScore += 3;
    score += engagementScore;
    
    if (intentResult.hasUrgency) score += 5;
    if (totalMessages > 5) score += 3;
    
    const sentimentScore = calculateSentiment(lowerText);
    if (sentimentScore > 0.6) score += 5;
    else if (sentimentScore < 0.4) score -= 3;
    
    score = Math.max(0, Math.min(100, Math.round(score)));
    
    return {
        score,
        buyingSignals: [...new Set(buyingSignals)].slice(0, 10),
        riskSignals: [...new Set(riskSignals)].slice(0, 10),
        sentiment: Math.round(sentimentScore * 10000) / 10000,
        breakdown: {
            intent: intentScores[intentResult.primary] || 0,
            buyingSignals: Math.min(buyingSignals.length * 2.5, 25),
            riskPenalty: -Math.min(riskSignals.length * 2, 15),
            productInterest: Math.min(productMentions * 5, 20),
            priceInquiry: hasPriceInquiry || productResult.priceInquiries?.length > 0 ? 10 : 0,
            engagement: engagementScore
        }
    };
}

function calculateSentiment(text) {
    let score = 0.5;
    for (const word of POSITIVE_WORDS) {
        if (new RegExp(`\\b${word}\\b`, 'gi').test(text)) score += 0.05;
    }
    for (const word of NEGATIVE_WORDS) {
        if (new RegExp(`\\b${word}\\b`, 'gi').test(text)) score -= 0.05;
    }
    return Math.max(0, Math.min(1, score));
}

export default { calculateInterestScore };
