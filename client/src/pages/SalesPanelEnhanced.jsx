import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBots } from '../context/BotsContext';
import { useTranslation } from 'react-i18next';
import { BarChart3, MessageSquare, TrendingUp, Zap, Download, ChevronDown, Star, FileText } from 'lucide-react';
import KanbanPipeline from '../components/organisms/KanbanPipeline';
import AnalyzedChatsGrid from '../components/organisms/AnalyzedChatsGrid';
import ChatDetailsPanel from '../components/organisms/ChatDetailsPanel';

/**
 * SalesPanelEnhanced.jsx - Sales Panel mejorado con análisis de chats
 * Integra Kanban, Grid de chats analizados, y detalles de leads
 */

const SalesPanelEnhanced = () => {
  const { user } = useAuth();
  const { sseConnected } = useBots();
  const { t } = useTranslation();

  // Estados
  const [activeTab, setActiveTab] = useState('kanban'); // kanban, grid, live
  const [analyzedChats, setAnalyzedChats] = useState([]);
  const [pipelineCategories, setPipelineCategories] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    avgScore: 0,
    assigned: 0,
    converted: 0
  });

  // Cargar datos iniciales
  useEffect(() => {
    loadAnalyzedChats();
    loadCategories();
    loadStatistics();
  }, []);

  const loadAnalyzedChats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analyzed-chats?limit=100', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Error cargando chats');

      const data = await response.json();
      setAnalyzedChats(data.data || []);
    } catch (error) {
      console.error('Error cargando chats analizados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/analyzed-chats/categories', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Error cargando categorías');

      const data = await response.json();
      setPipelineCategories(data.data || []);
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await fetch('/api/analyzed-chats/statistics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Error cargando estadísticas');

      const data = await response.json();
      
      // Calcular estadísticas
      const chatStats = {
        total: analyzedChats.length,
        avgScore: Math.round(
          analyzedChats.reduce((sum, c) => sum + (c.lead_score || 0), 0) / (analyzedChats.length || 1)
        ),
        assigned: analyzedChats.filter(c => c.assigned_to).length,
        converted: analyzedChats.filter(c => c.lead_score >= 70).length
      };

      setStats(chatStats);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  // Manejar cambio de categoría (Drag & Drop)
  const handleCategoryChange = async (chatId, newCategory) => {
    try {
      const response = await fetch(`/api/analyzed-chats/${chatId}/category`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          newCategory,
          reason: 'Cambio manual desde Sales Panel'
        })
      });

      if (!response.ok) throw new Error('Error actualizando categoría');

      // Actualizar estado local
      setAnalyzedChats(chats =>
        chats.map(c =>
          c.id === chatId ? { ...c, pipeline_category: newCategory } : c
        )
      );

      // Actualizar chat seleccionado
      if (selectedChat?.id === chatId) {
        setSelectedChat(prev => ({ ...prev, pipeline_category: newCategory }));
      }
    } catch (error) {
      console.error('Error actualizando categoría:', error);
    }
  };

  // Manejar asignación de chat
  const handleAssignChat = async (chatId) => {
    try {
      const response = await fetch(`/api/analyzed-chats/${chatId}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId: user?.id
        })
      });

      if (!response.ok) throw new Error('Error asignando chat');

      const data = await response.json();

      // Actualizar estado local
      setAnalyzedChats(chats =>
        chats.map(c =>
          c.id === chatId ? data.data : c
        )
      );

      if (selectedChat?.id === chatId) {
        setSelectedChat(data.data);
      }
    } catch (error) {
      console.error('Error asignando chat:', error);
    }
  };

  // Manejar exportación CSV
  const handleExport = async (endpoint, filename) => {
    try {
      setExportLoading(true);
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Error en exportación');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();

      window.URL.revokeObjectURL(url);
      setShowExportMenu(false);
    } catch (error) {
      console.error('Error exportando:', error);
      alert('Error al descargar archivo');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col">
      {/* HEADER */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              🎯 Sales Pipeline
            </h1>
            <p className="text-slate-400 text-sm sm:text-base">
              Gestiona tus leads y chats analizados en tiempo real
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Estado SSE */}
            <div
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium ${
                sseConnected
                  ? 'bg-green-500/20 text-green-400 ring-1 ring-green-500/30'
                  : 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full mr-2 ${
                  sseConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`}
              />
              {sseConnected ? 'Conectado' : 'Desconectado'}
            </div>

            {/* Botón de Exportación */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={exportLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg border border-emerald-500/30 text-sm font-semibold transition disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Exportar</span>
                <ChevronDown className={`w-4 h-4 transition ${showExportMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Menú desplegable */}
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
                  <div className="p-2">
                    <ExportMenuItem
                      icon={<Download className="w-5 h-5" />}
                      label="Todos los Chats"
                      description="Descarga completa de todos los clientes"
                      onClick={() => handleExport('/api/analyzed-chats/export/all', 'chats-analizados.csv')}
                      loading={exportLoading}
                    />
                    <ExportMenuItem
                      icon={<Star className="w-5 h-5" />}
                      label="Leads Alto Valor"
                      description="Solo leads con puntuación > 70"
                      onClick={() => handleExport('/api/analyzed-chats/export/high-value', 'leads-alto-valor.csv')}
                      loading={exportLoading}
                    />
                    <ExportMenuItem
                      icon={<FileText className="w-5 h-5" />}
                      label="Estadísticas"
                      description="Resumen mensual del pipeline"
                      onClick={() => handleExport('/api/analyzed-chats/export/statistics', 'estadisticas.csv')}
                      loading={exportLoading}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            icon={<BarChart3 className="w-5 h-5" />}
            label="Total Chats"
            value={stats.total}
            color="bg-blue-500/10 text-blue-400"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Score Promedio"
            value={stats.avgScore}
            color="bg-yellow-500/10 text-yellow-400"
          />
          <StatCard
            icon={<MessageSquare className="w-5 h-5" />}
            label="Asignados"
            value={stats.assigned}
            color="bg-emerald-500/10 text-emerald-400"
          />
          <StatCard
            icon={<Star className="w-5 h-5" />}
            label="Leads (Score > 70)"
            value={stats.converted}
            color="bg-purple-500/10 text-purple-400"
          />
        </div>
      </header>

      {/* TABS */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-4 sm:px-6 lg:px-8">
        <div className="flex gap-1 py-3">
          <TabButton
            label="🎯 Kanban Pipeline"
            active={activeTab === 'kanban'}
            onClick={() => setActiveTab('kanban')}
          />
          <TabButton
            label="💬 Chats Analizados"
            active={activeTab === 'grid'}
            onClick={() => setActiveTab('grid')}
          />
          <TabButton
            label="⚡ Tiempo Real"
            active={activeTab === 'live'}
            onClick={() => setActiveTab('live')}
          />
        </div>
      </div>

      {/* CONTENIDO DINÁMICO */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 overflow-hidden flex gap-4">
        {/* Panel principal */}
        <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
          {activeTab === 'kanban' && (
            <KanbanPipeline
              chats={analyzedChats}
              categories={pipelineCategories}
              onChatSelect={setSelectedChat}
              onCategoryChange={handleCategoryChange}
              loading={loading}
            />
          )}

          {activeTab === 'grid' && (
            <div className="flex-1 overflow-auto p-6">
              <AnalyzedChatsGrid
                chats={analyzedChats}
                categories={pipelineCategories}
                loading={loading}
                onChatSelect={setSelectedChat}
                onCategoryChange={handleCategoryChange}
                onAssign={handleAssignChat}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filterCategory={filterCategory}
                onFilterChange={setFilterCategory}
              />
            </div>
          )}

          {activeTab === 'live' && (
            <RealTimeLeadsPanel
              chats={analyzedChats.filter(c => c.lead_score >= 70 && c.assigned_to)}
              categories={pipelineCategories}
              onChatSelect={setSelectedChat}
              onCategoryChange={handleCategoryChange}
              onAssign={handleAssignChat}
            />
          )}
        </div>

        {/* Panel de detalles (Sidebar) */}
        {selectedChat && (
          <ChatDetailsPanel
            chat={selectedChat}
            onClose={() => setSelectedChat(null)}
            onAssign={handleAssignChat}
            categories={pipelineCategories}
          />
        )}
      </main>
    </div>
  );
};

/**
 * StatCard - Tarjeta de estadística
 */
const StatCard = ({ icon, label, value, color }) => (
  <div className={`p-3 sm:p-4 rounded-lg border border-slate-700 ${color.split(' ')[0]}`}>
    <div className="flex items-center gap-2">
      <div className={`p-2 rounded-lg ${color.split(' ')[0]}`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-slate-400 text-xs font-medium">{label}</p>
        <p className={`text-2xl font-bold ${color.split(' ')[1]}`}>{value}</p>
      </div>
    </div>
  </div>
);

/**
 * TabButton - Botón de tab
 */
const TabButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
      active
        ? 'bg-slate-700 text-white'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
    }`}
  >
    {label}
  </button>
);

/**
 * ExportMenuItem - Elemento del menú de exportación
 */
const ExportMenuItem = ({ icon, label, description, onClick, loading }) => (
  <button
    onClick={onClick}
    disabled={loading}
    className="w-full text-left px-4 py-3 hover:bg-slate-700/50 rounded-lg transition disabled:opacity-50 mb-1 flex items-start gap-3"
  >
    <div className="text-emerald-400 mt-0.5">
      {icon}
    </div>
    <div className="flex-1">
      <p className="text-sm font-semibold text-slate-100">{label}</p>
      <p className="text-xs text-slate-400 mt-0.5">{description}</p>
    </div>
  </button>
);

/**
 * RealTimeLeadsPanel - Panel con todos los leads asignados
 */
const RealTimeLeadsPanel = ({ chats, categories, onChatSelect, onCategoryChange, onAssign }) => {
  if (!chats || chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Star className="w-16 h-16 text-slate-600 mb-4" />
        <p className="text-slate-400 text-lg">No hay leads asignados</p>
        <p className="text-slate-500 text-sm mt-2">Los leads con puntuación > 70 aparecerán aquí cuando se asignen</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header de leads */}
      <div className="border-b border-slate-700 p-4 bg-slate-800/50">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-400" />
          Leads Asignados ({chats.length})
        </h3>
        <p className="text-sm text-slate-400 mt-1">Chats con puntuación > 70 asignados a vendedores</p>
      </div>

      {/* Lista de leads */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 p-4">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => onChatSelect(chat)}
              className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:bg-slate-800 hover:border-slate-600 transition cursor-pointer"
            >
              {/* Header del lead */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-white truncate">
                    {chat.contact_name || chat.phone}
                  </h4>
                  <p className="text-xs text-slate-400">{chat.phone}</p>
                </div>
                <div className="ml-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    chat.lead_score >= 85
                      ? 'bg-red-500/20 text-red-400'
                      : chat.lead_score >= 75
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {chat.lead_score?.toFixed(0)}
                  </span>
                </div>
              </div>

              {/* Métrica de análisis */}
              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div className="bg-slate-700/30 rounded p-2">
                  <p className="text-slate-400">Engagement</p>
                  <p className="text-slate-100 font-semibold">{chat.engagement?.toFixed(0)}%</p>
                </div>
                <div className="bg-slate-700/30 rounded p-2">
                  <p className="text-slate-400">Confianza</p>
                  <p className="text-slate-100 font-semibold">{chat.confidence?.toFixed(0)}%</p>
                </div>
              </div>

              {/* Categoría actual */}
              <div className="mb-3">
                <p className="text-xs text-slate-400 mb-1">Categoría</p>
                <select
                  value={chat.pipeline_category}
                  onChange={(e) => {
                    e.stopPropagation();
                    onCategoryChange(chat.id, e.target.value);
                  }}
                  className="w-full bg-slate-700 text-slate-100 text-xs rounded px-2 py-1.5 border border-slate-600 focus:outline-none focus:border-blue-500"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Asignado a */}
              <div className="mb-3 p-2 bg-emerald-500/10 rounded border border-emerald-500/20">
                <p className="text-xs text-emerald-400 font-semibold">
                  👤 {chat.assigned_to || 'Sin asignar'}
                </p>
              </div>

              {/* Último mensaje */}
              <div className="text-xs">
                <p className="text-slate-400 mb-1">Último mensaje:</p>
                <p className="text-slate-300 truncate">{chat.last_message || 'Sin mensajes'}</p>
              </div>

              {/* Fecha y contador */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700 text-xs text-slate-400">
                <span>{chat.message_count || 0} mensajes</span>
                <span>
                  {chat.updated_at
                    ? new Date(chat.updated_at).toLocaleTimeString('es-MX', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'N/A'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SalesPanelEnhanced;
