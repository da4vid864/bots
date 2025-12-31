import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Eye } from 'lucide-react';

/**
 * KanbanPipeline.jsx - Kanban board para visualizar chats en el pipeline
 * Integra analyzed_chats con categorías del pipeline
 */

const KanbanPipeline = ({ 
  chats = [], 
  categories = [], 
  onChatSelect,
  onCategoryChange,
  loading = false 
}) => {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [draggedChat, setDraggedChat] = useState(null);

  // Agrupar chats por categoría
  const chatsByCategory = categories.reduce((acc, cat) => {
    acc[cat.name] = chats.filter(c => c.pipeline_category === cat.name) || [];
    return acc;
  }, {});

  const handleDragStart = (e, chat) => {
    setDraggedChat(chat);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnCategory = async (e, category) => {
    e.preventDefault();
    if (!draggedChat || draggedChat.pipeline_category === category.name) {
      return;
    }

    try {
      await onCategoryChange(draggedChat.id, category.name);
      setDraggedChat(null);
    } catch (error) {
      console.error('Error moviendo chat:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="flex gap-4 p-4 min-h-full">
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex-shrink-0 w-80 bg-slate-800 rounded-lg border border-slate-700 flex flex-col"
          >
            {/* Encabezado de categoría */}
            <div
              className="p-4 border-b border-slate-700 flex items-center justify-between cursor-pointer hover:bg-slate-700/50 transition"
              onClick={() => setExpandedCategory(
                expandedCategory === category.name ? null : category.name
              )}
              style={{ 
                backgroundColor: category.color_code + '15',
                borderLeftColor: category.color_code,
                borderLeftWidth: '4px'
              }}
            >
              <div className="flex-1">
                <h3 className="font-semibold text-white">
                  {category.display_name}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {chatsByCategory[category.name]?.length || 0} chats
                </p>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-slate-400 transition transform ${
                  expandedCategory === category.name ? 'rotate-180' : ''
                }`}
              />
            </div>

            {/* Zona de drop */}
            <div
              className="flex-1 p-4 space-y-3 overflow-y-auto"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDropOnCategory(e, category)}
            >
              {chatsByCategory[category.name]?.length > 0 ? (
                chatsByCategory[category.name].map((chat) => (
                  <ChatCard
                    key={chat.id}
                    chat={chat}
                    onDragStart={handleDragStart}
                    onClick={() => onChatSelect(chat)}
                    categoryColor={category.color_code}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Arrastra chats aquí
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * ChatCard - Tarjeta de chat individual
 */
const ChatCard = ({ chat, onDragStart, onClick, categoryColor }) => {
  const scoreColor = 
    chat.lead_score >= 70 ? 'text-red-400' :
    chat.lead_score >= 50 ? 'text-yellow-400' :
    'text-blue-400';

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, chat)}
      onClick={onClick}
      className="p-3 bg-slate-700 rounded-lg border border-slate-600 hover:border-slate-500 cursor-move transition hover:shadow-lg hover:shadow-slate-900"
    >
      {/* Avatar y nombre */}
      <div className="flex items-start gap-3 mb-2">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ backgroundColor: categoryColor }}
        >
          {(chat.contact_name || chat.contact_phone).charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white text-sm truncate">
            {chat.contact_name || 'Sin nombre'}
          </h4>
          <p className="text-xs text-slate-400 truncate">
            {chat.contact_phone}
          </p>
        </div>
      </div>

      {/* Score del lead */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 bg-slate-600 rounded-full h-1.5">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${chat.lead_score}%`,
              backgroundColor: categoryColor
            }}
          ></div>
        </div>
        <span className={`text-xs font-semibold ${scoreColor}`}>
          {chat.lead_score}
        </span>
      </div>

      {/* Última interacción */}
      {chat.last_message_content && (
        <p className="text-xs text-slate-300 line-clamp-2 mb-2">
          {chat.last_message_content}
        </p>
      )}

      {/* Productos mencionados */}
      {chat.products_mentioned && chat.products_mentioned.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {chat.products_mentioned.slice(0, 2).map((product, idx) => (
            <span
              key={idx}
              className="inline-block text-xs bg-slate-600 text-slate-200 px-2 py-0.5 rounded"
            >
              {product.name}
            </span>
          ))}
          {chat.products_mentioned.length > 2 && (
            <span className="text-xs text-slate-400">
              +{chat.products_mentioned.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Metadata */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-600 text-xs text-slate-400">
        <span>
          {new Date(chat.last_message_at || chat.analyzed_at).toLocaleDateString('es-ES')}
        </span>
        {chat.assigned_to && (
          <span className="bg-slate-600 px-2 py-0.5 rounded">
            Asignado
          </span>
        )}
        <Eye className="w-3 h-3" />
      </div>
    </div>
  );
};

export default KanbanPipeline;
