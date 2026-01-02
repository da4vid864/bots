import React, { useState, useMemo, memo, useCallback } from 'react';
import { Search, Filter, ChevronUp, ChevronDown, BarChart3, User, Clock, TrendingUp } from 'lucide-react';
import { useDebounce } from '../../hooks/useOptimizations';

/**
 * AnalyzedChatsGrid.jsx - Vista de tabla/grid de chats analizados
 * Permite filtrado, búsqueda y acciones rápidas
 */

const AnalyzedChatsGrid = ({
  chats = [],
  categories = [],
  loading = false,
  onChatSelect,
  onCategoryChange,
  onAssign,
  searchTerm = '',
  onSearchChange,
  filterCategory = null,
  onFilterChange
}) => {
  const [sortConfig, setSortConfig] = useState({ key: 'lead_score', direction: 'desc' });
  const [expandedChat, setExpandedChat] = useState(null);
  
  // Debounce de búsqueda para mejor performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Filtrar y ordenar chats
  const filteredChats = useMemo(() => {
    let filtered = chats;

    // Aplicar filtro de categoría
    if (filterCategory) {
      filtered = filtered.filter(c => c.pipeline_category === filterCategory);
    }

    // Aplicar búsqueda (usando término debounced)
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        (c.contact_name && c.contact_name.toLowerCase().includes(term)) ||
        (c.contact_phone && c.contact_phone.includes(term)) ||
        (c.contact_email && c.contact_email.toLowerCase().includes(term))
      );
    }

    // Aplicar ordenamiento
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [chats, filterCategory, debouncedSearchTerm, sortConfig]);

  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  }, []);

  const getCategoryColor = (categoryName) => {
    const category = categories.find(c => c.name === categoryName);
    return category?.color_code || '#3b82f6';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros y búsqueda */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o email..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            aria-label="Buscar chats"
          />
        </div>

        {/* Filtro de categoría */}
        <select
          value={filterCategory || ''}
          onChange={(e) => onFilterChange(e.target.value || null)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          <option value="">Todas las categorías</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.name}>
              {cat.display_name}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full text-sm">
          {/* Encabezado */}
          <thead>
            <tr className="bg-slate-800 border-b border-slate-700">
              <TableHeader
                label="Contacto"
                sortKey="contact_name"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <TableHeader
                label="Teléfono"
                sortKey="contact_phone"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <TableHeader
                label="Score"
                sortKey="lead_score"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <TableHeader
                label="Categoría"
                sortKey="pipeline_category"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <TableHeader
                label="Última Int."
                sortKey="last_message_at"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <th className="px-6 py-3 text-left font-semibold text-slate-300">Acciones</th>
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-slate-700">
            {filteredChats.length > 0 ? (
              filteredChats.map((chat) => (
                <ChatRow
                  key={chat.id}
                  chat={chat}
                  categories={categories}
                  onSelect={() => onChatSelect(chat)}
                  onCategoryChange={onCategoryChange}
                  onAssign={onAssign}
                  isExpanded={expandedChat === chat.id}
                  onToggleExpand={() => setExpandedChat(
                    expandedChat === chat.id ? null : chat.id
                  )}
                />
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                  No se encontraron chats
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <StatCard
          icon={<BarChart3 className="w-4 h-4" />}
          label="Total"
          value={filteredChats.length}
          color="bg-blue-500/10 text-blue-400"
        />
        <StatCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Score Promedio"
          value={Math.round(
            filteredChats.reduce((sum, c) => sum + (c.lead_score || 0), 0) / (filteredChats.length || 1)
          )}
          color="bg-yellow-500/10 text-yellow-400"
        />
        <StatCard
          icon={<User className="w-4 h-4" />}
          label="Asignados"
          value={filteredChats.filter(c => c.assigned_to).length}
          color="bg-emerald-500/10 text-emerald-400"
        />
        <StatCard
          icon={<Clock className="w-4 h-4" />}
          label="Últimos 24h"
          value={filteredChats.filter(c => {
            const analyzed = new Date(c.analyzed_at);
            const now = new Date();
            return (now - analyzed) < 86400000;
          }).length}
          color="bg-purple-500/10 text-purple-400"
        />
      </div>
    </div>
  );
};

/**
 * TableHeader - Encabezado sorteable
 */
const TableHeader = ({ label, sortKey, sortConfig, onSort }) => (
  <th
    className="px-6 py-3 text-left font-semibold text-slate-300 hover:bg-slate-700/50 cursor-pointer transition"
    onClick={() => onSort(sortKey)}
  >
    <div className="flex items-center gap-2">
      {label}
      {sortConfig.key === sortKey && (
        sortConfig.direction === 'desc' ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronUp className="w-4 h-4" />
        )
      )}
    </div>
  </th>
);

/**
 * ChatRow - Fila de chat con acciones
 */
const ChatRow = ({
  chat,
  categories,
  onSelect,
  onCategoryChange,
  onAssign,
  isExpanded,
  onToggleExpand
}) => {
  const category = categories.find(c => c.name === chat.pipeline_category);
  const scoreColor = 
    chat.lead_score >= 70 ? 'bg-red-500/10 text-red-400' :
    chat.lead_score >= 50 ? 'bg-yellow-500/10 text-yellow-400' :
    'bg-blue-500/10 text-blue-400';

  return (
    <>
      <tr className="hover:bg-slate-800/50 transition">
        <td className="px-6 py-4">
          <button
            onClick={onSelect}
            className="font-medium text-white hover:text-blue-400 transition text-left"
          >
            {chat.contact_name || 'Sin nombre'}
          </button>
          {chat.contact_email && (
            <p className="text-xs text-slate-500">{chat.contact_email}</p>
          )}
        </td>
        <td className="px-6 py-4 text-slate-300 font-mono text-sm">
          {chat.contact_phone}
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="w-12 bg-slate-700 rounded-full h-1.5">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${chat.lead_score}%`,
                  backgroundColor: category?.color_code || '#3b82f6'
                }}
              ></div>
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded ${scoreColor}`}>
              {chat.lead_score}
            </span>
          </div>
        </td>
        <td className="px-6 py-4">
          <select
            value={chat.pipeline_category}
            onChange={(e) => onCategoryChange(chat.id, e.target.value)}
            className="px-3 py-1 rounded text-sm"
            style={{
              backgroundColor: category?.color_code + '20',
              color: category?.color_code || '#3b82f6',
              border: `1px solid ${category?.color_code || '#3b82f6'}`
            }}
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>
                {cat.display_name}
              </option>
            ))}
          </select>
        </td>
        <td className="px-6 py-4 text-slate-400 text-xs">
          {chat.last_message_at ? (
            new Date(chat.last_message_at).toLocaleDateString('es-ES')
          ) : (
            '-'
          )}
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <button
              onClick={onSelect}
              className="px-3 py-1 text-xs bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded transition"
            >
              Ver
            </button>
            <button
              onClick={() => onAssign(chat.id)}
              className="px-3 py-1 text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded transition"
            >
              Asignar
            </button>
          </div>
        </td>
      </tr>

      {/* Fila expandida con detalles */}
      {isExpanded && (
        <tr className="bg-slate-800/30">
          <td colSpan="6" className="px-6 py-4">
            <ChatDetails chat={chat} onToggleExpand={onToggleExpand} />
          </td>
        </tr>
      )}
    </>
  );
};

/**
 * ChatDetails - Detalles expandidos del chat
 */
const ChatDetails = ({ chat, onToggleExpand }) => (
  <div className="space-y-3">
    {chat.analysis_results && (
      <>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-slate-400">Intención</p>
            <p className="text-white font-semibold capitalize">
              {chat.analysis_results.intencion || '-'}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Confianza</p>
            <p className="text-white font-semibold">
              {Math.round((chat.analysis_results.confianza || 0) * 100)}%
            </p>
          </div>
          <div>
            <p className="text-slate-400">Urgencia</p>
            <p className="text-white font-semibold">
              {Math.round((chat.analysis_results.urgencia || 0) * 100)}%
            </p>
          </div>
          <div>
            <p className="text-slate-400">Sentimiento</p>
            <p className={`font-semibold ${
              (chat.analysis_results.sentimiento || 0) > 0.5 ? 'text-emerald-400' :
              (chat.analysis_results.sentimiento || 0) < -0.5 ? 'text-red-400' :
              'text-slate-400'
            }`}>
              {(chat.analysis_results.sentimiento || 0) > 0.5 ? 'Positivo' :
               (chat.analysis_results.sentimiento || 0) < -0.5 ? 'Negativo' :
               'Neutral'}
            </p>
          </div>
        </div>

        {chat.products_mentioned && chat.products_mentioned.length > 0 && (
          <div>
            <p className="text-slate-400 text-sm mb-2">Productos mencionados</p>
            <div className="flex flex-wrap gap-2">
              {chat.products_mentioned.map((product, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-slate-700 text-slate-200 px-3 py-1 rounded"
                >
                  {product.name} ({product.mention_count}x)
                </span>
              ))}
            </div>
          </div>
        )}

        {chat.analysis_results.proximoPaso && (
          <div>
            <p className="text-slate-400 text-sm mb-1">Próximo paso sugerido</p>
            <p className="text-white text-sm italic">
              {chat.analysis_results.proximoPaso}
            </p>
          </div>
        )}
      </>
    )}
  </div>
);

/**
 * StatCard - Tarjeta de estadística
 */
const StatCard = ({ icon, label, value, color }) => (
  <div className={`p-4 rounded-lg border border-slate-700 ${color.split(' ')[0]}`}>
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${color.split(' ')[0]}`}>
        {icon}
      </div>
      <div>
        <p className="text-slate-400 text-xs">{label}</p>
        <p className={`text-2xl font-bold ${color.split(' ')[1]}`}>{value}</p>
      </div>
    </div>
  </div>
);

export default AnalyzedChatsGrid;
