import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBots } from '../context/BotsContext';
import { useTranslation } from 'react-i18next';
import { BarChart3, MessageSquare, TrendingUp, Zap, Download, ChevronDown } from 'lucide-react';
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
        converted: analyzedChats.filter(c => c.status === 'converted').length
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
                      label="📥 Todos los Chats"
                      description="Descarga completa de todos los clientes"
                      onClick={() => handleExport('/api/analyzed-chats/export/all', 'chats-analizados.csv')}
                      loading={exportLoading}
                    />
                    <ExportMenuItem
                      label="⭐ Leads Alto Valor"
                      description="Solo leads con puntuación > 70"
                      onClick={() => handleExport('/api/analyzed-chats/export/high-value', 'leads-alto-valor.csv')}
                      loading={exportLoading}
                    />
                    <ExportMenuItem
                      label="📊 Estadísticas"
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
            icon={<Zap className="w-5 h-5" />}
            label="Convertidos"
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
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Zap className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">
                  Interfaz de tiempo real - En desarrollo
                </p>
              </div>
            </div>
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
const ExportMenuItem = ({ label, description, onClick, loading }) => (
  <button
    onClick={onClick}
    disabled={loading}
    className="w-full text-left px-4 py-3 hover:bg-slate-700/50 rounded-lg transition disabled:opacity-50 mb-1"
  >
    <p className="text-sm font-semibold text-slate-100">{label}</p>
    <p className="text-xs text-slate-400 mt-0.5">{description}</p>
  </button>
);

export default SalesPanelEnhanced;
