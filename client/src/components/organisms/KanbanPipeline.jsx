import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { ChevronDown, Plus, Eye } from 'lucide-react';
import { useUserPreferences } from '../../hooks/useUserPreferences';

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
  const { preferences, updatePreference } = useUserPreferences();
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [draggedChat, setDraggedChat] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [draggedColumn, setDraggedColumn] = useState(null);
  const containerRef = useRef(null);
  
  // Usar orden de columnas guardado o el orden por defecto
  const orderedCategories = useMemo(() => {
    const savedOrder = preferences.kanbanColumnOrder;
    if (savedOrder && savedOrder.length === categories.length) {
      return savedOrder
        .map(id => categories.find(cat => cat.id === id))
        .filter(Boolean);
    }
    return categories;
  }, [categories, preferences.kanbanColumnOrder]);

  // Detectar móvil
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Agrupar chats por categoría (memoizado)
  const chatsByCategory = useMemo(() => {
    return orderedCategories.reduce((acc, cat) => {
      acc[cat.name] = chats.filter(c => c.pipeline_category === cat.name) || [];
      return acc;
    }, {});
  }, [chats, orderedCategories]);
  
  // Handlers para reordenar columnas
  const handleColumnDragStart = useCallback((e, category) => {
    if (isMobile) return;
    setDraggedColumn(category);
    e.dataTransfer.effectAllowed = 'move';
  }, [isMobile]);
  
  const handleColumnDragOver = useCallback((e) => {
    if (isMobile || !draggedColumn) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, [isMobile, draggedColumn]);
  
  const handleColumnDrop = useCallback((e, targetCategory) => {
    if (isMobile || !draggedColumn || draggedColumn.id === targetCategory.id) return;
    e.preventDefault();
    
    const newOrder = [...orderedCategories];
    const draggedIndex = newOrder.findIndex(c => c.id === draggedColumn.id);
    const targetIndex = newOrder.findIndex(c => c.id === targetCategory.id);
    
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedColumn);
    
    updatePreference('kanbanColumnOrder', newOrder.map(c => c.id));
    setDraggedColumn(null);
  }, [isMobile, draggedColumn, orderedCategories, updatePreference]);

  // Drag & Drop para desktop
  const handleDragStart = (e, chat) => {
    if (isMobile) return; // Deshabilitar drag en móvil
    setDraggedChat(chat);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    if (isMobile) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnCategory = async (e, category) => {
    if (isMobile) return;
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

  // Touch handlers para móvil
  const handleTouchStart = (e, chat) => {
    if (!isMobile) return;
    setTouchStart(e.touches[0].clientX);
    setDraggedChat(chat);
  };

  const handleTouchMove = (e) => {
    if (!isMobile) return;
    setTouchEnd(e.touches[0].clientX);
  };

  const handleTouchEnd = async (category) => {
    if (!isMobile || !touchStart || !touchEnd || !draggedChat) return;
    
    const distance = touchStart - touchEnd;
    const isSwipe = Math.abs(distance) > 50; // Mínimo 50px para considerar swipe

    if (isSwipe && draggedChat.pipeline_category !== category.name) {
      try {
        await onCategoryChange(draggedChat.id, category.name);
      } catch (error) {
        console.error('Error moviendo chat:', error);
      }
    }

    setTouchStart(null);
    setTouchEnd(null);
    setDraggedChat(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" role="status" aria-label="Cargando pipeline">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-700 border-t-blue-500" aria-hidden="true"></div>
        <span className="sr-only">Cargando pipeline...</span>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="h-full overflow-x-auto overflow-y-hidden" 
      role="application" 
      aria-label="Pipeline de ventas"
    >
      <div className="flex gap-4 p-4 min-h-full min-w-max lg:min-w-0">
        {orderedCategories.map((category) => (
          <div
            key={category.id}
            draggable={!isMobile}
            onDragStart={(e) => handleColumnDragStart(e, category)}
            onDragOver={handleColumnDragOver}
            onDrop={(e) => handleColumnDrop(e, category)}
            className={`flex-shrink-0 w-72 sm:w-80 bg-slate-800 rounded-lg border border-slate-700 flex flex-col transition-all ${
              draggedColumn?.id === category.id ? 'opacity-50' : ''
            } ${!isMobile ? 'hover:border-slate-600 cursor-move' : ''}`}
            role="region"
            aria-label={`Columna: ${category.display_name}`}
          >
            {/* Encabezado de categoría */}
            <button
              type="button"
              className="w-full p-4 border-b border-slate-700 flex items-center justify-between cursor-pointer hover:bg-slate-700/50 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
              onClick={() => setExpandedCategory(
                expandedCategory === category.name ? null : category.name
              )}
              aria-expanded={expandedCategory === category.name}
              aria-controls={`category-${category.id}-content`}
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
                aria-hidden="true"
              />
            </button>

            {/* Zona de drop */}
            <div
              id={`category-${category.id}-content`}
              className="flex-1 p-2 sm:p-4 space-y-3 overflow-y-auto min-h-[200px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDropOnCategory(e, category)}
              onTouchEnd={() => handleTouchEnd(category)}
              role="group"
              aria-label={`Área de soltar para ${category.display_name}`}
              aria-dropeffect="move"
            >
              {chatsByCategory[category.name]?.length > 0 ? (
                chatsByCategory[category.name].map((chat) => (
                  <ChatCard
                    key={chat.id}
                    chat={chat}
                    onDragStart={handleDragStart}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onClick={() => onChatSelect(chat)}
                    categoryColor={category.color_code}
                    isMobile={isMobile}
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
 * ChatCard - Tarjeta de chat individual (memoizado para mejor performance)
 */
const ChatCard = memo(({ chat, onDragStart, onClick, categoryColor, isMobile, onTouchStart, onTouchMove }) => {
  const scoreColor = 
    chat.lead_score >= 70 ? 'text-red-400' :
    chat.lead_score >= 50 ? 'text-yellow-400' :
    'text-blue-400';

  return (
    <div
      draggable={!isMobile}
      onDragStart={(e) => onDragStart(e, chat)}
      onTouchStart={(e) => onTouchStart?.(e, chat)}
      onTouchMove={onTouchMove}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Chat de ${chat.contact_name || chat.contact_phone}, score: ${chat.lead_score}`}
      className={`p-3 bg-slate-700 rounded-lg border border-slate-600 hover:border-slate-500 ${
        isMobile ? 'cursor-pointer active:scale-95' : 'cursor-move'
      } transition-all duration-200 hover:shadow-lg hover:shadow-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800`}
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
});

ChatCard.displayName = 'ChatCard';

export default KanbanPipeline;
