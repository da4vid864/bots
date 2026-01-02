import React, { useState } from 'react';
import { X, MessageSquare, TrendingUp, Clock, User, MapPin, Mail, Phone, Download, Edit2 } from 'lucide-react';

/**
 * ChatDetailsPanel.jsx - Panel lateral con detalles completos del chat analizado
 */

const ChatDetailsPanel = ({ chat, onClose, onAssign, categories = [] }) => {
  const [notes, setNotes] = useState(chat?.notes || '');
  const [editingNotes, setEditingNotes] = useState(false);

  if (!chat) {
    return null;
  }

  const category = categories.find(c => c.name === chat.pipeline_category);
  const analysis = chat.analysis_results || {};

  const scoreColor = 
    chat.lead_score >= 70 ? 'text-red-400' :
    chat.lead_score >= 50 ? 'text-yellow-400' :
    'text-blue-400';

  return (
    <div className="w-full sm:w-96 bg-slate-900 border-l border-slate-700 flex flex-col overflow-hidden">
      {/* Encabezado */}
      <div className="p-6 border-b border-slate-700 flex items-center justify-between bg-slate-800/50">
        <h2 className="text-lg font-bold text-white">Detalles del Chat</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-700 rounded transition"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Contenido scrollable */}
      <div className="flex-1 overflow-y-auto">
        {/* Información de contacto */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl"
              style={{ backgroundColor: category?.color_code || '#3b82f6' }}
            >
              {(chat.contact_name || chat.contact_phone).charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white">
                {chat.contact_name || 'Sin nombre'}
              </h3>
              <p className="text-sm text-slate-400">{chat.contact_phone}</p>
            </div>
          </div>

          {/* Contacto info */}
          <div className="space-y-2 text-sm">
            {chat.contact_email && (
              <div className="flex items-center gap-3 text-slate-300">
                <Mail className="w-4 h-4 text-slate-500" />
                <span>{chat.contact_email}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-slate-300">
              <Phone className="w-4 h-4 text-slate-500" />
              <span className="font-mono">{chat.contact_phone}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>
                {new Date(chat.analyzed_at).toLocaleDateString('es-ES')}
              </span>
            </div>
          </div>
        </div>

        {/* Score y categoría */}
        <div className="p-6 border-b border-slate-700 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-white">
                Lead Score
              </label>
              <span className={`text-lg font-bold ${scoreColor}`}>
                {chat.lead_score}/100
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${chat.lead_score}%`,
                  backgroundColor: category?.color_code || '#3b82f6'
                }}
              ></div>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-white block mb-2">
              Categoría del Pipeline
            </label>
            <div
              className="p-3 rounded-lg border-2"
              style={{
                backgroundColor: category?.color_code + '10',
                borderColor: category?.color_code,
                color: category?.color_code
              }}
            >
              <p className="font-semibold">{category?.display_name}</p>
              <p className="text-xs opacity-75 mt-1">
                {category?.description}
              </p>
            </div>
          </div>
        </div>

        {/* Análisis AI */}
        {analysis && Object.keys(analysis).length > 0 && (
          <div className="p-6 border-b border-slate-700 space-y-4">
            <h4 className="font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Análisis de IA
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                label="Intención"
                value={analysis.intencion}
                color="bg-blue-500/10 text-blue-400"
              />
              <MetricCard
                label="Confianza"
                value={`${Math.round((analysis.confianza || 0) * 100)}%`}
                color="bg-yellow-500/10 text-yellow-400"
              />
              <MetricCard
                label="Urgencia"
                value={`${Math.round((analysis.urgencia || 0) * 100)}%`}
                color="bg-red-500/10 text-red-400"
              />
              <MetricCard
                label="Engagement"
                value={`${Math.round((analysis.engagement || 0) * 100)}%`}
                color="bg-emerald-500/10 text-emerald-400"
              />
            </div>

            {analysis.resumen && (
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-2">
                  Resumen
                </label>
                <p className="text-sm text-slate-300 italic">
                  "{analysis.resumen}"
                </p>
              </div>
            )}

            {analysis.banderaBuena && analysis.banderaBuena.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-emerald-400 block mb-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                  Señales Positivas
                </label>
                <ul className="space-y-1">
                  {analysis.banderaBuena.map((signal, idx) => (
                    <li key={idx} className="text-sm text-slate-300 flex gap-2">
                      <span className="text-emerald-400">•</span>
                      {signal}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.banderaRoja && analysis.banderaRoja.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-red-400 block mb-2 flex items-center gap-1">
                  <WarningIcon className="w-4 h-4" />
                  Señales Negativas
                </label>
                <ul className="space-y-1">
                  {analysis.banderaRoja.map((signal, idx) => (
                    <li key={idx} className="text-sm text-slate-300 flex gap-2">
                      <span className="text-red-400">•</span>
                      {signal}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Productos mencionados */}
        {chat.products_mentioned && chat.products_mentioned.length > 0 && (
          <div className="p-6 border-b border-slate-700">
            <h4 className="font-bold text-white mb-3">
              Productos Mencionados
            </h4>
            <div className="space-y-2">
              {chat.products_mentioned.map((product, idx) => (
                <div key={idx} className="p-3 bg-slate-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">
                      {product.name}
                    </span>
                    <span className="text-xs bg-slate-700 text-slate-200 px-2 py-1 rounded">
                      {product.mention_count} menciones
                    </span>
                  </div>
                  {product.intent && (
                    <p className="text-xs text-slate-400 mt-1">
                      Intención: {product.intent}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Próximos pasos */}
        {analysis.proximoPaso && (
          <div className="p-6 border-b border-slate-700">
            <h4 className="font-bold text-white mb-3">
              Próximo Paso Sugerido
            </h4>
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-200">
                {analysis.proximoPaso}
              </p>
            </div>
          </div>
        )}

        {/* Notas */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-slate-400" />
              Notas
            </h4>
            <button
              onClick={() => setEditingNotes(!editingNotes)}
              className="p-1 hover:bg-slate-700 rounded transition"
            >
              <Edit2 className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          {editingNotes ? (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Añade notas sobre este lead..."
              className="w-full h-24 p-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
            />
          ) : (
            <p className="text-sm text-slate-300 italic">
              {notes || 'Sin notas'}
            </p>
          )}
        </div>

        {/* Metadata */}
        <div className="p-6 border-b border-slate-700 text-xs text-slate-400 space-y-2">
          <div className="flex justify-between">
            <span>Mensajes procesados:</span>
            <span className="text-white">{chat.messages_count || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Analizado:</span>
            <span className="text-white">
              {new Date(chat.analyzed_at).toLocaleString('es-ES')}
            </span>
          </div>
          {chat.assigned_to && (
            <div className="flex justify-between">
              <span>Asignado a:</span>
              <span className="text-white">{chat.assigned_to_email || 'Usuario'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer con acciones */}
      <div className="p-6 border-t border-slate-700 space-y-2">
        <button
          onClick={() => onAssign(chat.id)}
          className="w-full px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition"
        >
          Asignar a vendedor
        </button>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

/**
 * MetricCard - Tarjeta de métrica pequeña
 */
const MetricCard = ({ label, value, color }) => (
  <div className={`p-3 rounded-lg ${color}`}>
    <p className="text-xs opacity-75">{label}</p>
    <p className="font-bold text-sm mt-1">{value}</p>
  </div>
);

export default ChatDetailsPanel;
