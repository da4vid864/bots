  // services/deepseekService.js
  const axios = require('axios');

  async function getChatReply(message, history = [], systemPrompt) {
    try {
      const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
      if (!DEEPSEEK_API_KEY) {
        throw new Error('DEEPSEEK_API_KEY no configurada');
      }

      // If systemPrompt is not provided, we could fetch it here if we had botId
      // But typically the caller (baileysManager) constructs the prompt including available tools/images.
      // So we trust the caller to have injected the correct tenant-specific system prompt.

      const messages = [
        { role: 'system', content: systemPrompt || 'Eres un asistente útil.' },
        ...history,
        { role: 'user', content: message }
      ];

      const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
        model: 'deepseek-chat',
        messages: messages,
      }, {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.choices[0].message.content;

    } catch (error) {
      console.error('❌ ERROR EN DEEPSEEK:', error.message);
      return "Lo siento, estoy teniendo problemas técnicos.";
    }
  }

  /**
   * Detects user intent for image requests.
   * @param {string} text
   * @returns {Promise<boolean>}
   */
  async function detectUserIntent(text) {
    try {
      const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
      if (!DEEPSEEK_API_KEY) return false;

      const systemPrompt = "Analyze the user's message. If and ONLY IF the user explicitly asks to see a photo, image, or visual representation of a product (e.g., 'send photo', 'show me', 'color options'), return the string 'YES'. Otherwise, return 'NO'.";

      const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0,
        max_tokens: 5
      }, {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      const content = response.data.choices[0].message.content.trim().toUpperCase();
      return content.includes('YES');
    } catch (error) {
      console.error('⚠️ Error detecting intent:', error.message);
      return false;
    }
  }

  module.exports = { getChatReply, detectUserIntent };