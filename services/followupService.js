/**
 * Follow-up Recommendation Service
 * Generates follow-up recommendations based on analysis
 * 
 * Phase 1: Core Analysis Engine
 */

/**
 * Generates follow-up recommendations based on analysis results
 * @param {Object} conversationData - Aggregated conversation data
 * @param {Object} interestResult - Interest scoring result
 * @param {Object} stageResult - Stage prediction result
 * @returns {Object} Follow-up recommendations with timing and priority
 */
export function generateFollowupRecommendations(conversationData, interestResult, stageResult) {
    const { lastMessageAt, uniqueContactDays, totalMessages, inboundCount } = conversationData;
    const score = interestResult.score;
    const stage = stageResult.stage;
    
    let recommendedTime = new Date();
    let priority = 'medium';
    const actions = [];
    
    // Determine priority based on score
    if (score >= 80) {
        priority = 'high';
        actions.push('Contactar inmediatamente - lead caliente');
    } else if (score >= 60) {
        priority = 'high';
        actions.push('Contactar en las próximas 24 horas');
    } else if (score >= 40) {
        priority = 'medium';
        actions.push('Seguir nurturando - enviar información');
    } else {
        priority = 'low';
        actions.push('Agregar a campaña de email marketing');
    }
    
    // Determine follow-up timing
    const lastMessage = lastMessageAt ? new Date(lastMessageAt) : new Date();
    const hoursSinceLastMessage = (Date.now() - lastMessage.getTime()) / (1000 * 60 * 60);
    
    if (stage === 'proposal' || stage === 'negotiation') {
        if (hoursSinceLastMessage > 24) {
            recommendedTime = new Date();
            actions.unshift('URGENTE: Responder mensaje pendiente');
        } else if (hoursSinceLastMessage > 4) {
            recommendedTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
            actions.unshift('Responder en breve');
        }
    } else if (stage === 'qualified') {
        recommendedTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
        actions.push('Enviar propuesta personalizada');
    } else if (uniqueContactDays === 1 && totalMessages <= 3) {
        recommendedTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
        actions.push('Bienvenida inicial y presentar opciones');
    } else if (stage === 'new') {
        recommendedTime = new Date(Date.now() + 48 * 60 * 60 * 1000);
        actions.push('Enviar contenido de valor');
    }
    
    // Stage-specific actions
    const stageActions = {
        new: ['Enviar catálogo', 'Preguntar intereses', 'Presentar promoción'],
        contacted: ['Continuar conversación', 'Ofrecer información', 'Compartir testimonios'],
        qualified: ['Enviar caso de éxito', 'Proponer llamada', 'Compartir información detallada'],
        proposal: ['Enviar cotización', 'Aclarar dudas', 'Resaltar beneficios'],
        negotiation: ['Preparar propuesta final', 'Ofrecer descuento', 'Cerrar con llamada'],
        won: ['Confirmar compra', 'Enviar factura', 'Coordinar entrega'],
        lost: ['Revisar razones', 'Mantener para futuro', 'Enviar encuesta']
    };
    
    if (stageActions[stage]) {
        actions.push(...stageActions[stage].filter(a => !actions.includes(a)));
    }
    
    return {
        recommendedTime: recommendedTime.toISOString(),
        priority,
        actions: actions.slice(0, 5),
        stage,
        score,
        hoursSinceLastMessage: Math.round(hoursSinceLastMessage * 10) / 10
    };
}

export default { generateFollowupRecommendations };
