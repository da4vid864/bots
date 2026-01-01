// services/leadExtractionService.js
import axios from 'axios';

/**
 * @typedef {Object} ExtractedLeadInfo
 * @property {string} [name] - Extracted full name of the lead.
 * @property {string} [email] - Extracted email address of the lead.
 * @property {string} [location] - Extracted location or city of the lead.
 * @property {string} [phone] - Extracted phone number (different from WhatsApp number).
 */

/**
 * Uses AI to extract contact information from the user's message.
 * Returns an object with the detected fields.
 * 
 * @param {string} message - The message text from the user.
 * @returns {Promise<ExtractedLeadInfo>} The extracted information object.
 */
async function extractLeadInfo(message) {
    try {
        const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
        if (!DEEPSEEK_API_KEY) {
            throw new Error('DEEPSEEK_API_KEY no configurada');
        }

        const systemPrompt = `Eres un asistente que extrae información de contacto de mensajes.
Debes identificar y extraer:
- name: Nombre completo de la persona
- email: Correo electrónico
- location: Ubicación, ciudad, dirección o país
- phone: Número de teléfono (puede ser diferente al de WhatsApp)

Responde ÚNICAMENTE con un JSON válido con los campos detectados.
Si no detectas algún campo, omítelo del JSON.
Ejemplo de respuesta: {"name": "Juan Pérez", "email": "juan@example.com"}

NO incluyas explicaciones, solo el JSON.`;

        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: 'deepseek-chat',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message }
            ],
            temperature: 0.1
        }, {
            headers: {
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const aiResponse = response.data.choices[0].message.content.trim();
        
        // Intentar parsear el JSON
        try {
            // Limpiar posibles marcadores de código
            const cleanedResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
            const extractedData = JSON.parse(cleanedResponse);
            return extractedData;
        } catch (parseError) {
            console.error('Error parseando respuesta de IA:', aiResponse);
            return {};
        }

    } catch (error) {
        console.error('❌ ERROR EN EXTRACCIÓN DE INFO:', error.message);
        return {};
    }
}

/**
 * Generates an intelligent follow-up question to request missing information.
 * Prioritizes missing fields in the order: name, email, location.
 * 
 * @param {Object} lead - The lead object to analyze.
 * @param {string} [lead.name] - The lead's name.
 * @param {string} [lead.email] - The lead's email.
 * @param {string} [lead.location] - The lead's location.
 * @returns {Promise<string|null>} A follow-up question or null if all information is present.
 */
async function generateFollowUpQuestion(lead) {
    const missingFields = [];
    if (!lead.name) missingFields.push('nombre completo');
    if (!lead.email) missingFields.push('correo electrónico');
    if (!lead.location) missingFields.push('ubicación o ciudad');
    // Ya no preguntamos por teléfono, usaremos el WhatsApp

    if (missingFields.length === 0) return null;

    const questions = {
        'nombre completo': '¿Podrías compartirme tu nombre completo? 😊',
        'correo electrónico': '¿Cuál es tu correo electrónico para enviarte más información?',
        'ubicación o ciudad': '¿Desde dónde nos contactas? (ciudad o ubicación)'
    };

    // Retornar la pregunta del primer campo faltante
    return questions[missingFields[0]];
}

export {
    extractLeadInfo,
    generateFollowUpQuestion
};

export default {
    extractLeadInfo,
    generateFollowUpQuestion
};
