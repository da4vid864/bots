/**
 * WebChatWidget.jsx
 * Componente React para widget de chat web (embebible en sitios de tenants)
 * Conecta con backend omnicanal para captura de leads desde web
 */

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Send, X, MessageCircle } from 'lucide-react';

const WebChatWidget = ({ tenantId, botName = 'Soporte' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [leadInfo, setLeadInfo] = useState(null);
  const messagesEndRef = useRef(null);

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  /**
   * Scroll automático al último mensaje
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Inicializa sesión de chat
   */
  useEffect(() => {
    if (isOpen && !leadInfo) {
      initializeChatSession();
    }
  }, [isOpen]);

  /**
   * Crea o recupera sesión de lead
   */
  const initializeChatSession = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/web-chat/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId
        },
        body: JSON.stringify({
          source: 'web_widget',
          userAgent: navigator.userAgent,
          referrer: document.referrer,
          timestamp: new Date()
        })
      });

      if (!response.ok) throw new Error('Error inicializando chat');

      const data = await response.json();
      setLeadInfo(data.lead);

      // Mensaje de bienvenida
      setMessages([{
        id: 'welcome',
        role: 'bot',
        content: `¡Hola! Soy ${botName}. ¿En qué puedo ayudarte hoy?`,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('❌ Error inicializando sesión:', error);
      setMessages([{
        id: 'error',
        role: 'bot',
        content: 'Lo siento, no puedo conectar en este momento. Intenta más tarde.',
        timestamp: new Date()
      }]);
    }
  };

  /**
   * Envía mensaje al bot
   */
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !leadInfo) return;

    const userMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/web-chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          'X-Lead-ID': leadInfo.id
        },
        body: JSON.stringify({
          message: userMessage.content,
          leadId: leadInfo.id,
          sessionId: leadInfo.session_id,
          timestamp: new Date()
        })
      });

      if (!response.ok) throw new Error('Error enviando mensaje');

      const data = await response.json();

      // Respuesta del bot
      const botMessage = {
        id: `msg_${Date.now()}`,
        role: 'bot',
        content: data.reply,
        timestamp: new Date(),
        metadata: data.metadata // Puede contener sugerencias, botones, etc
      };

      setMessages(prev => [...prev, botMessage]);

      // Actualizar info del lead si cambió
      if (data.updatedLead) {
        setLeadInfo(data.updatedLead);
      }
    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
      const errorMessage = {
        id: `msg_${Date.now()}`,
        role: 'bot',
        content: 'Perdón, tuve un problema procesando tu mensaje. Intenta de nuevo.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Captura información del visitante
   */
  const captureLeadInfo = async (field, value) => {
    try {
      const response = await fetch(`${API_BASE}/api/web-chat/lead-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          'X-Lead-ID': leadInfo.id
        },
        body: JSON.stringify({
          leadId: leadInfo.id,
          field,
          value,
          timestamp: new Date()
        })
      });

      if (response.ok) {
        const data = await response.json();
        setLeadInfo(data.updatedLead);
      }
    } catch (error) {
      console.warn('⚠️ Error capturando info:', error);
    }
  };

  return (
    <>
      {/* Botón flotante */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-white z-50 hover:scale-110"
          aria-label="Abrir chat"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Widget de chat */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{botName}</h3>
              <p className="text-sm opacity-90">Usualmente responde en minutos</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-blue-700 p-1 rounded transition-colors"
              aria-label="Cerrar chat"
            >
              <X size={20} />
            </button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] px-4 py-2 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : 'bg-gray-200 text-gray-800 rounded-bl-none'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {msg.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg rounded-bl-none">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="border-t p-4 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Escribe tu mensaje..."
                disabled={isLoading}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 disabled:bg-gray-100"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
                aria-label="Enviar"
              >
                <Send size={18} />
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="bg-gray-100 px-4 py-2 text-center text-xs text-gray-600">
            Powered by BotInteligente
          </div>
        </div>
      )}

      {/* Estilos adicionales */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { opacity: 0.5; }
          40% { opacity: 1; }
        }
        .animate-bounce { animation: bounce 1.4s infinite; }
        .delay-100 { animation-delay: 0.2s; }
        .delay-200 { animation-delay: 0.4s; }
      `}</style>
    </>
  );
};

export default WebChatWidget;
