/**
 * Stage Prediction Service
 * Predicts lead pipeline stage based on conversation analysis
 * 
 * Phase 1: Core Analysis Engine
 */

// Stage transition keywords
const STAGE_KEYWORDS = {
    new: ['hola', 'buenos', 'hi', 'hello', 'primer', 'primera', 'nuevo', 'nueva'],
    contacted: ['gracias', 'ok', 'okay', 'si', 'yes', 'entiendo', 'understood'],
    qualified: ['interesad', 'informacion', 'details', 'more', 'quiero saber'],
    proposal: ['precio', 'costo', 'price', 'quote', 'cotizacion', 'presupuesto'],
    negotiation: ['discount', 'descuento', 'oferta', 'deal', 'terminos', 'conditions'],
    won: ['comprar', 'comprado', 'aceptado', 'proceder', 'buy', 'purchase', 'confirm'],
    lost: ['no', 'cancelar', 'cancelado', 'otro', 'another', 'later']
};

/**
 * Predicts lead pipeline stage based on conversation analysis
 * @param {Object} conversationData - Aggregated conversation data
 * @param {Object} intentResult - Intent classification result
 * @param {Object} interestResult - Interest scoring result
 * @returns {Object} Stage prediction with confidence and indicators
 */
export function predictStage(conversationData, intentResult, interestResult) {
    const { allText, uniqueContactDays, totalMessages, inboundCount } = conversationData;
    const lowerText = allText.toLowerCase();
    const score = interestResult.score;
    const intent = intentResult.primary;
    
    const indicators = [];
    let stage = 'new';
    let confidence = 0.5;
    
    // Calculate keyword matches per stage
    const stageMatches = {};
    for (const [stageName, keywords] of Object.entries(STAGE_KEYWORDS)) {
        let matches = 0;
        for (const keyword of keywords) {
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            const found = lowerText.match(regex);
            if (found) matches += found.length;
        }
        stageMatches[stageName] = matches;
    }
    
    // Decision tree based on score and intent
    if (intent === 'cancellation') {
        stage = 'lost';
        confidence = 0.9;
        indicators.push('Intención de cancelación');
        indicators.push('Score de interés bajo');
    }
    else if (intent === 'purchase' && score >= 70) {
        // Check for buying confirmation keywords
        const buyingKeywords = ['comprar', 'comprado', 'si', 'yes', 'aceptado', 'confirm'];
        const hasBuyingConfirmation = buyingKeywords.some(k => 
            new RegExp(`\\b${k}\\b`, 'gi').test(lowerText)
        );
        
        if (hasBuyingConfirmation || score >= 85) {
            stage = 'won';
            confidence = 0.9;
            indicators.push('Confirmación de compra');
            indicators.push(`Score muy alto: ${score}`);
        } else {
            stage = 'negotiation';
            confidence = 0.75;
            indicators.push('Alta intención de compra');
            indicators.push('En negociación');
        }
    }
    else if (score >= 60 && (intent === 'purchase' || intent === 'inquiry')) {
        stage = 'proposal';
        confidence = 0.7;
        indicators.push('Score de interés alto');
        indicators.push('Solicitando información de precio');
    }
    else if (score >= 40 && intent === 'inquiry') {
        stage = 'qualified';
        confidence = 0.65;
        indicators.push('Interés medio-alto');
        indicators.push('Fase de cualificación');
    }
    else if (score >= 25 && totalMessages >= 3) {
        stage = 'contacted';
        confidence = 0.6;
        indicators.push('Conversación iniciada');
        indicators.push('Múltiples intercambios');
    }
    else {
        // Default to new
        stage = 'new';
        confidence = 0.7;
        indicators.push('Primera interacción');
        if (totalMessages > 1) {
            stage = 'contacted';
            indicators.push('Conversación breve');
        }
    }
    
    // Adjust confidence based on conversation depth
    if (totalMessages >= 10) confidence = Math.min(confidence + 0.1, 0.95);
    if (uniqueContactDays >= 3) confidence = Math.min(confidence + 0.05, 0.95);
    if (inboundCount === 1 && totalMessages === 1) confidence = 0.85;
    
    // Add stage-specific indicators
    if (stage === 'proposal') {
        indicators.push(`Consultas de precio: ${stageMatches.proposal}`);
    }
    if (stage === 'negotiation') {
        indicators.push('Palabras de negociación detectadas');
    }
    if (stage === 'won') {
        indicators.push('Conversión confirmada');
    }
    if (stage === 'lost') {
        indicators.push('Riesgo de pérdida detectado');
    }
    
    return {
        stage,
        confidence: Math.round(confidence * 10000) / 10000,
        indicators: indicators.slice(0, 5),
        score,
        intent,
        stageMatches
    };
}

/**
 * Gets stage transition recommendations
 */
export function getStageRecommendations(currentStage, analysis) {
    const recommendations = {
        new: [
            'Enviar mensaje de bienvenida',
            'Presentar productos/servicios principales',
            'Preguntar por intereses específicos'
        ],
        contacted: [
            'Continuar conversación activa',
            'Ofrecer información adicional',
            'Programar seguimiento'
        ],
        qualified: [
            'Enviar propuesta de valor',
            'Compartir casos de éxito',
            'Proponer llamada o reunión'
        ],
        proposal: [
            'Enviar cotización formal',
            'Clarificar dudas sobre precio',
            'Resaltar beneficios'
        ],
        negotiation: [
            'Preparar propuesta final',
            'Definir términos y condiciones',
            'Cerrar con llamada de seguimiento'
        ],
        won: [
            'Confirmar detalles de compra',
            'Procesar pago',
            'Coordinar entrega/implementación'
        ],
        lost: [
            'Solicitar feedback',
            'Documentar razones de pérdida',
            'Mantener relación para futuro'
        ]
    };
    
    return {
        currentStage,
        actions: recommendations[currentStage] || [],
        analysis: {
            score: analysis.score,
            intent: analysis.intent,
            confidence: analysis.confidence
        }
    };
}

export default { predictStage, getStageRecommendations };
