/**
 * predictiveEngineService.js
 * Motor de análisis predictivo para scoring, detección de churn, y recomendaciones
 * Base para evolución del scoringService existente
 */

import { query as pool } from './db.js';
import { getChatReply } from './deepseekService.js';

class PredictiveEngine {
  constructor() {
    this.models = {
      leadScore: 'random_forest', // Placeholder para modelo futuro
      churnDetection: 'logistic_regression',
      intentDetection: 'nlp_classifier'
    };
  }

  /**
   * Calcula score predictivo avanzado de un lead
   * Combina: histórico de interacciones, patrones de respuesta, intención detectada
   */
  async calculateAdvancedLeadScore(tenantId, leadId) {
    try {
      const lead = await pool(
        'SELECT * FROM leads WHERE id = $1 AND tenant_id = $2',
        [leadId, tenantId]
      );

      if (lead.rows.length === 0) {
        return { score: 0, components: {}, error: 'Lead not found' };
      }

      const leadData = lead.rows[0];

      // 1. Score histórico (mantener compatibilidad con scoring_service)
      const baseScore = leadData.score || 0;

      // 2. Análisis de patrones de respuesta
      const responsePatterns = await this._analyzeResponsePatterns(tenantId, leadId);
      const responseScore = responsePatterns.engagement * 0.3;

      // 3. Análisis temporal (recency, frequency)
      const temporalScore = await this._calculateTemporalScore(tenantId, leadId);

      // 4. Análisis de intención desde mensajes recientes
      const intentionScore = await this._analyzeIntention(tenantId, leadId);

      // 5. Predicción de churn
      const churnRisk = await this._predictChurnRisk(tenantId, leadId);

      // Combinar scores con pesos
      const weights = {
        base: 0.25,
        response: 0.25,
        temporal: 0.20,
        intention: 0.20,
        churnAvoidance: 0.10
      };

      const finalScore = Math.min(100, Math.max(0,
        (baseScore * weights.base) +
        (responseScore * weights.response) +
        (temporalScore * weights.temporal) +
        (intentionScore * weights.intention) +
        ((100 - churnRisk.riskScore) * weights.churnAvoidance)
      ));

      // Guardar histórico para análisis
      await this._logScoreChange(tenantId, leadId, baseScore, finalScore, 'advanced_calculation');

      return {
        score: Math.round(finalScore),
        components: {
          base: baseScore,
          response: responseScore,
          temporal: temporalScore,
          intention: intentionScore,
          churnRisk: churnRisk.riskScore
        },
        churnRisk: churnRisk,
        recommendation: this._generateRecommendation(finalScore, churnRisk),
        calculatedAt: new Date()
      };
    } catch (error) {
      console.error('❌ Error en calculateAdvancedLeadScore:', error.message);
      return { score: 0, error: error.message };
    }
  }

  /**
   * Detecta si un mensaje contiene indicadores de intención de compra
   */
  async analyzeMessageIntention(tenantId, message, leadId = null) {
    try {
      const keywords = {
        high_intent: ['comprar', 'quiero', 'precio', 'disponibilidad', 'pago', 'envío', 'entrega', 'promo', 'descuento'],
        medium_intent: ['interesado', 'me gusta', 'información', 'detalles', 'especificaciones'],
        low_intent: ['gracias', 'ok', 'vale', 'entiendo'],
        negative_intent: ['no me interesa', 'cancelar', 'borrar', 'no escribas más', 'spam']
      };

      const messageLower = message.toLowerCase();
      let intentScore = 50; // Base neutral

      // Análisis de keywords
      for (const keyword of keywords.high_intent) {
        if (messageLower.includes(keyword)) intentScore = Math.min(100, intentScore + 15);
      }
      for (const keyword of keywords.medium_intent) {
        if (messageLower.includes(keyword)) intentScore += 10;
      }
      for (const keyword of keywords.low_intent) {
        if (messageLower.includes(keyword)) intentScore = Math.max(0, intentScore - 5);
      }
      for (const keyword of keywords.negative_intent) {
        if (messageLower.includes(keyword)) intentScore = Math.max(0, intentScore - 30);
      }

      // Análisis de longitud y profundidad (leads interesados suelen escribir más)
      const wordCount = message.split(' ').length;
      if (wordCount > 20) intentScore += 10;
      if (wordCount < 2) intentScore -= 5;

      // Si tenemos leadId, guardar predicción
      if (leadId) {
        await this.logEvent(tenantId, 'intention_analysis', {
          lead_id: leadId,
          message: message.substring(0, 100),
          intention_score: intentScore,
          timestamp: new Date()
        });
      }

      return {
        score: Math.min(100, Math.max(0, intentScore)),
        level: intentScore > 70 ? 'high' : intentScore > 50 ? 'medium' : 'low',
        keywordsMatched: this._findMatchedKeywords(messageLower, keywords),
        recommendation: this._getIntentionRecommendation(intentScore)
      };
    } catch (error) {
      console.error('❌ Error en analyzeMessageIntention:', error.message);
      return { score: 50, level: 'unknown', error: error.message };
    }
  }

  /**
   * Predice riesgo de churn basado en patrones de actividad
   */
  async _predictChurnRisk(tenantId, leadId) {
    try {
      const lead = await pool(
        `SELECT last_message_date, created_at, score 
         FROM leads WHERE id = $1 AND tenant_id = $2`,
        [leadId, tenantId]
      );

      if (lead.rows.length === 0) {
        return { riskScore: 50, reason: 'No data' };
      }

      const leadData = lead.rows[0];
      const daysSinceLastMessage = Math.floor(
        (new Date() - new Date(leadData.last_message_date)) / (1000 * 60 * 60 * 24)
      );

      // Heurística simple: inactividad por >7 días
      let riskScore = 0;
      let reasons = [];

      if (daysSinceLastMessage > 14) {
        riskScore = 80;
        reasons.push('Sin interacción por 14+ días');
      } else if (daysSinceLastMessage > 7) {
        riskScore = 60;
        reasons.push('Sin interacción por 7-14 días');
      } else if (daysSinceLastMessage > 3) {
        riskScore = 30;
        reasons.push('Sin interacción por 3-7 días');
      }

      // Score bajo también indica potencial churn
      if (leadData.score < 30) {
        riskScore = Math.max(riskScore, 70);
        reasons.push('Score bajo (<30)');
      }

      // Mensajes recientes con respuesta negativa reducen riesgo (engagement activo)
      if (daysSinceLastMessage < 1 && leadData.score > 50) {
        riskScore = Math.max(0, riskScore - 20);
        reasons.push('Engagement reciente positivo');
      }

      return {
        riskScore: Math.min(100, Math.max(0, riskScore)),
        level: riskScore > 70 ? 'high' : riskScore > 40 ? 'medium' : 'low',
        daysSinceLastMessage,
        reasons,
        suggestedAction: this._getChurnPreventionAction(riskScore, daysSinceLastMessage)
      };
    } catch (error) {
      console.error('❌ Error en _predictChurnRisk:', error.message);
      return { riskScore: 50, error: error.message };
    }
  }

  /**
   * Analiza patrones de respuesta del lead
   */
  async _analyzeResponsePatterns(tenantId, leadId) {
    try {
      const messages = await pool(
        `SELECT role, created_at FROM lead_messages 
         WHERE lead_id = $1 AND tenant_id = $2 
         ORDER BY created_at DESC LIMIT 20`,
        [leadId, tenantId]
      );

      const data = messages.rows;
      let userMessages = 0;
      let botMessages = 0;
      let avgResponseTime = 0;

      // Contar mensajes y analizar tiempos
      for (let i = 0; i < data.length; i++) {
        if (data[i].role === 'user') userMessages++;
        else botMessages++;
      }

      const engagement = userMessages > 0 ? (userMessages / (userMessages + botMessages) * 100) : 0;

      return {
        engagement: Math.min(100, Math.max(0, engagement)),
        totalMessages: data.length,
        userMessageRatio: userMessages / (userMessages + botMessages || 1)
      };
    } catch (error) {
      console.error('❌ Error en _analyzeResponsePatterns:', error.message);
      return { engagement: 50, totalMessages: 0, userMessageRatio: 0 };
    }
  }

  /**
   * Calcula score basado en recency y frequency
   */
  async _calculateTemporalScore(tenantId, leadId) {
    try {
      const lead = await pool(
        `SELECT created_at, last_message_date FROM leads 
         WHERE id = $1 AND tenant_id = $2`,
        [leadId, tenantId]
      );

      if (lead.rows.length === 0) return 0;

      const { created_at, last_message_date } = lead.rows[0];
      const daysSinceCreation = Math.floor(
        (new Date() - new Date(created_at)) / (1000 * 60 * 60 * 24)
      );
      const daysSinceLastMsg = Math.floor(
        (new Date() - new Date(last_message_date)) / (1000 * 60 * 60 * 24)
      );

      // Leads recientes con actividad = score alto
      if (daysSinceCreation < 7 && daysSinceLastMsg < 1) return 90;
      if (daysSinceCreation < 30 && daysSinceLastMsg < 3) return 75;
      if (daysSinceLastMsg < 7) return 60;
      if (daysSinceLastMsg < 14) return 40;
      return 20;
    } catch (error) {
      console.error('❌ Error en _calculateTemporalScore:', error.message);
      return 0;
    }
  }

  /**
   * Analiza intención desde mensajes del lead
   */
  async _analyzeIntention(tenantId, leadId) {
    try {
      const recentMessages = await pool(
        `SELECT content FROM lead_messages 
         WHERE lead_id = $1 AND tenant_id = $2 AND role = 'user'
         ORDER BY created_at DESC LIMIT 5`,
        [leadId, tenantId]
      );

      let intentScore = 0;
      for (const msg of recentMessages.rows) {
        const analysis = await this.analyzeMessageIntention(tenantId, msg.content);
        intentScore += analysis.score;
      }

      return recentMessages.rows.length > 0 
        ? intentScore / recentMessages.rows.length 
        : 50;
    } catch (error) {
      console.error('❌ Error en _analyzeIntention:', error.message);
      return 50;
    }
  }

  /**
   * Genera recomendación accionable basada en score
   */
  _generateRecommendation(score, churnRisk) {
    if (churnRisk.level === 'high') {
      return 'URGENTE: Enviar mensaje personalizado para re-engagement';
    } else if (score >= 80) {
      return 'CALIENTE: Ofrecer promoción o cierre de venta';
    } else if (score >= 60) {
      return 'TIBIO: Enviar contenido educativo relevante';
    } else if (score >= 40) {
      return 'FRÍO: Iniciar secuencia de nurturing';
    } else {
      return 'SEÑUELO: No priorizar, mantener en base de datos';
    }
  }

  /**
   * Obtiene acción sugerida para prevenir churn
   */
  _getChurnPreventionAction(riskScore, daysSinceLastMsg) {
    if (riskScore > 70) {
      return 'Enviar mensaje sorpresa con descuento exclusivo';
    } else if (riskScore > 40) {
      return 'Enviar contenido relevante o encuesta de satisfacción';
    }
    return 'Mantener contacto regular';
  }

  /**
   * Recomendación basada en intención
   */
  _getIntentionRecommendation(score) {
    if (score > 70) return 'Iniciar proceso de cierre inmediatamente';
    if (score > 50) return 'Enviar información de producto y precios';
    return 'Continuar calificación';
  }

  /**
   * Encuentra keywords coincidentes
   */
  _findMatchedKeywords(messageLower, keywords) {
    const matched = [];
    for (const [category, words] of Object.entries(keywords)) {
      for (const word of words) {
        if (messageLower.includes(word)) {
          matched.push(word);
        }
      }
    }
    return [...new Set(matched)];
  }

  /**
   * Registra cambios en score para auditoría
   */
  async _logScoreChange(tenantId, leadId, oldScore, newScore, reason) {
    try {
      await pool(
        `INSERT INTO lead_score_history (tenant_id, lead_id, old_score, new_score, reason, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [tenantId, leadId, oldScore, newScore, reason, new Date()]
      );
    } catch (error) {
      console.warn('⚠️ Error registrando score change:', error.message);
    }
  }

  /**
   * Registra eventos internos
   */
  async logEvent(tenantId, eventType, data) {
    try {
      await pool(
        `INSERT INTO analytics_events (tenant_id, event_type, event_data, created_at)
         VALUES ($1, $2, $3, $4)`,
        [tenantId, eventType, JSON.stringify(data), new Date()]
      );
    } catch (error) {
      console.warn('⚠️ Error en logEvent:', error.message);
    }
  }
}

export default new PredictiveEngine();
