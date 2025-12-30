import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from 'react-i18next';
import { useBots } from '../context/BotsContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

// ===== ICONS =====
const AddIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const GripIcon = () => (
  <svg className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
    <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const MailIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const LocationIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const UserAssignIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

// ===== HELPERS =====
const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
};

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return 'Sin contacto';
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
};

const getScoreColor = (score) => {
  if (score >= 70) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  if (score >= 40) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  return 'bg-slate-700 text-slate-400 border-slate-600';
};

const getScoreBgGradient = (score) => {
  if (score >= 70) return 'from-emerald-500 to-teal-600';
  if (score >= 40) return 'from-amber-500 to-orange-600';
  return 'from-slate-600 to-slate-700';
};

const getStageColor = (type, color) => {
  if (color) return color;
  switch (type) {
    case 'WON': return '#10b981';
    case 'LOST': return '#ef4444';
    default: return '#3b82f6';
  }
};

// ===== DEFAULT PIPELINE STAGES =====
const DEFAULT_STAGES = [
  { id: 'new', name: 'Nuevos', type: 'OPEN', color: '#3b82f6', order: 0 },
  { id: 'contacted', name: 'Contactados', type: 'OPEN', color: '#8b5cf6', order: 1 },
  { id: 'qualified', name: 'Calificados', type: 'OPEN', color: '#f59e0b', order: 2 },
  { id: 'proposal', name: 'Propuesta', type: 'OPEN', color: '#06b6d4', order: 3 },
  { id: 'won', name: 'Ganados', type: 'WON', color: '#10b981', order: 4 },
  { id: 'lost', name: 'Perdidos', type: 'LOST', color: '#ef4444', order: 5 },
];

// ===== LEAD DETAIL MODAL =====
const LeadDetailModal = ({ lead, onClose, onAssign, onUpdateStage, stages, user }) => {
  if (!lead) return null;

  const [assigning, setAssigning] = useState(false);

  const handleAssign = async () => {
    setAssigning(true);
    try {
      await onAssign(lead.id);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getScoreBgGradient(lead.score)} flex items-center justify-center text-white font-bold`}>
              {getInitials(lead.name || lead.whatsapp_number)}
            </div>
            <div>
              <h3 className="font-semibold text-slate-100">
                {lead.name || 'Sin nombre'}
              </h3>
              <p className="text-sm text-slate-400">{lead.whatsapp_number}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh] space-y-4">
          {/* Score */}
          <div className="bg-slate-800/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-400">Lead Score</span>
              <span className={`text-2xl font-bold ${
                lead.score >= 70 ? 'text-emerald-400' :
                lead.score >= 40 ? 'text-amber-400' : 'text-slate-400'
              }`}>
                {lead.score || 0}%
              </span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${getScoreBgGradient(lead.score)}`}
                style={{ width: `${lead.score || 0}%` }}
              />
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-slate-800/50 rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-medium text-slate-300 mb-3">Información de contacto</h4>
            
            <div className="flex items-center gap-3 text-sm">
              <PhoneIcon />
              <span className="text-slate-300">{lead.whatsapp_number}</span>
            </div>
            
            {lead.email && (
              <div className="flex items-center gap-3 text-sm">
                <MailIcon />
                <span className="text-slate-300">{lead.email}</span>
              </div>
            )}
            
            {lead.location && (
              <div className="flex items-center gap-3 text-sm">
                <LocationIcon />
                <span className="text-slate-300">{lead.location}</span>
              </div>
            )}

            {lead.assigned_to && (
              <div className="flex items-center gap-3 text-sm">
                <UserAssignIcon />
                <span className="text-slate-300">Asignado a: {lead.assigned_to}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {lead.tags && lead.tags.length > 0 && (
            <div className="bg-slate-800/50 rounded-xl p-4">
              <h4 className="text-sm font-medium text-slate-300 mb-3">Etiquetas</h4>
              <div className="flex flex-wrap gap-2">
                {lead.tags.map((tag, i) => (
                  <span key={i} className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Stage Selector */}
          <div className="bg-slate-800/50 rounded-xl p-4">
            <h4 className="text-sm font-medium text-slate-300 mb-3">Mover a etapa</h4>
            <div className="grid grid-cols-2 gap-2">
              {stages.map(stage => (
                <button
                  key={stage.id}
                  onClick={() => onUpdateStage(lead.id, stage.id)}
                  className={`p-2 rounded-lg text-xs font-medium transition-all ${
                    lead.stage_id === stage.id
                      ? 'ring-2 ring-blue-500 bg-slate-700'
                      : 'bg-slate-700/50 hover:bg-slate-700'
                  }`}
                  style={{ borderLeft: `3px solid ${getStageColor(stage.type, stage.color)}` }}
                >
                  {stage.name}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-slate-800/50 rounded-xl p-4">
            <h4 className="text-sm font-medium text-slate-300 mb-3">Actividad</h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span>Creado: {new Date(lead.created_at).toLocaleDateString('es-MX')}</span>
              </div>
              {lead.qualified_at && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span>Calificado: {new Date(lead.qualified_at).toLocaleDateString('es-MX')}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                <span>Último mensaje: {formatRelativeTime(lead.last_message_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 flex gap-3">
          {!lead.assigned_to && (
            <button
              onClick={handleAssign}
              disabled={assigning}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {assigning ? 'Asignando...' : 'Asignar a mí'}
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 py-2.5 rounded-lg font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// ===== SORTABLE LEAD CARD =====
const SortableLead = ({ lead, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    data: { type: 'LEAD', lead },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const displayName = lead.name || lead.whatsapp_number;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(lead)}
      className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 hover:border-blue-500/50 cursor-grab active:cursor-grabbing transition-all duration-200 group hover:shadow-lg hover:shadow-blue-500/10"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getScoreBgGradient(lead.score)} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
            {getInitials(displayName)}
          </div>
          <div className="min-w-0">
            <h4 className="font-medium text-slate-100 truncate text-sm">{displayName}</h4>
            {lead.email && (
              <p className="text-xs text-slate-500 truncate">{lead.email}</p>
            )}
          </div>
        </div>
        {lead.score > 0 && (
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded border flex-shrink-0 ${getScoreColor(lead.score)}`}>
            {lead.score}%
          </span>
        )}
      </div>

      {/* Meta Info */}
      <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
        <span className="flex items-center gap-1">
          <ClockIcon />
          {formatRelativeTime(lead.last_message_at)}
        </span>
        {lead.location && (
          <span className="flex items-center gap-1 truncate">
            <LocationIcon />
            {lead.location}
          </span>
        )}
      </div>

      {/* Tags */}
      {lead.tags && lead.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {lead.tags.slice(0, 3).map((tag, i) => (
            <span key={i} className="text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">
              {tag}
            </span>
          ))}
          {lead.tags.length > 3 && (
            <span className="text-[10px] text-slate-500">+{lead.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Assigned */}
      {lead.assigned_to && (
        <div className="pt-2 border-t border-slate-700/50">
          <span className="text-xs text-purple-400">
            → {lead.assigned_to.split('@')[0]}
          </span>
        </div>
      )}

      {/* Quick Actions (on hover) */}
      <div className="pt-2 border-t border-slate-700/50 opacity-0 group-hover:opacity-100 transition-opacity flex justify-between">
        <button
          onClick={(e) => { e.stopPropagation(); onClick(lead); }}
          className="text-xs text-blue-400 hover:text-blue-300 font-medium"
        >
          Ver detalles
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); /* WhatsApp link */ }}
          className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
        >
          WhatsApp
        </button>
      </div>
    </div>
  );
};

// ===== SORTABLE STAGE COLUMN =====
const SortableStage = ({ stage, leads, onLeadClick, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: stage.id,
    data: { type: 'STAGE', stage },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const stageColor = getStageColor(stage.type, stage.color);

  // Calculate stage value (sum of lead scores or deal values)
  const stageValue = leads.reduce((sum, lead) => sum + (lead.deal_value || 0), 0);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex-shrink-0 w-72 md:w-80 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col max-h-full"
    >
      {/* Stage Header */}
      <div
        {...attributes}
        {...listeners}
        className="p-3 flex items-center justify-between cursor-grab active:cursor-grabbing border-b border-slate-800 hover:bg-slate-800/50 transition-colors rounded-t-xl"
        style={{ borderLeft: `4px solid ${stageColor}` }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <GripIcon />
          <div className="min-w-0">
            <span className="font-semibold text-slate-100 truncate block">{stage.name}</span>
            {stageValue > 0 && (
              <span className="text-xs text-slate-500">
                ${stageValue.toLocaleString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            stage.type === 'WON' ? 'bg-emerald-500/20 text-emerald-400' :
            stage.type === 'LOST' ? 'bg-red-500/20 text-red-400' :
            'bg-slate-700 text-slate-400'
          }`}>
            {stage.type === 'WON' ? '✓' : stage.type === 'LOST' ? '✗' : leads.length}
          </span>
        </div>
      </div>

      {/* Leads List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[120px]">
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {children}
        </SortableContext>

        {leads.length === 0 && (
          <div className="text-center py-8 text-slate-600 text-sm">
            <p>Sin leads</p>
            <p className="text-xs mt-1">Arrastra leads aquí</p>
          </div>
        )}
      </div>

      {/* Add Lead Button */}
      <button
        className="m-2 mt-0 text-sm text-slate-500 hover:text-slate-300 hover:bg-slate-800 py-2 rounded-lg border border-dashed border-slate-700 hover:border-slate-600 flex items-center justify-center transition-all"
      >
        <AddIcon />
        <span className="ml-2">Agregar lead</span>
      </button>
    </div>
  );
};

// ===== PIPELINE STATS =====
const PipelineStats = ({ stages, leadsByStage, leads }) => {
  const totalLeads = leads.length;
  const wonLeads = stages
    .filter(s => s.type === 'WON')
    .reduce((sum, stage) => sum + (leadsByStage[stage.id]?.length || 0), 0);
  const lostLeads = stages
    .filter(s => s.type === 'LOST')
    .reduce((sum, stage) => sum + (leadsByStage[stage.id]?.length || 0), 0);
  const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;
  const avgScore = totalLeads > 0 
    ? Math.round(leads.reduce((sum, l) => sum + (l.score || 0), 0) / totalLeads)
    : 0;

  const stats = [
    { label: 'Total Leads', value: totalLeads, color: 'text-slate-100' },
    { label: 'Ganados', value: wonLeads, color: 'text-emerald-400', icon: '✓' },
    { label: 'Perdidos', value: lostLeads, color: 'text-red-400', icon: '✗' },
    { label: 'Conversión', value: `${conversionRate}%`, color: 'text-blue-400' },
    { label: 'Score Promedio', value: `${avgScore}%`, color: 'text-purple-400' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-4">
      {stats.map((stat, i) => (
        <div key={i} className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
          <div className="text-xs text-slate-500 mb-1">{stat.label}</div>
          <div className={`text-xl font-bold ${stat.color} flex items-center gap-1`}>
            {stat.icon && <span>{stat.icon}</span>}
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
};

// ===== LOADING SKELETON =====
const LoadingSkeleton = () => (
  <div className="p-4 md:p-6 space-y-4 animate-pulse">
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="h-16 bg-slate-800 rounded-xl" />
      ))}
    </div>
    <div className="flex gap-4 overflow-hidden">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="w-80 h-96 bg-slate-800 rounded-xl flex-shrink-0" />
      ))}
    </div>
  </div>
);

// ===== MAIN COMPONENT =====
export default function PipelineBoardEnhanced() {
  const { t } = useTranslation();
  const { leads: contextLeads, assignLead } = useBots();
  const { user } = useAuth();

  const [pipelines, setPipelines] = useState([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState(null);
  const [leads, setLeads] = useState([]);
  const [activeDragItem, setActiveDragItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Sync leads from context
  useEffect(() => {
    if (contextLeads && contextLeads.length > 0) {
      setLeads(contextLeads.map(lead => ({
        ...lead,
        stage_id: lead.stage_id || getDefaultStageForLead(lead),
      })));
    }
  }, [contextLeads]);

  // Get default stage based on lead status
  const getDefaultStageForLead = (lead) => {
    if (lead.status === 'assigned') return 'contacted';
    if (lead.status === 'qualified') return 'qualified';
    return 'new';
  };

  // Fetch pipelines
  useEffect(() => {
    const fetchPipelines = async () => {
      setLoading(true);
      try {
        const res = await api.get('/api/pipelines');
        let loadedPipelines = [];
        
        if (Array.isArray(res.data)) {
          loadedPipelines = res.data;
        } else if (res.data?.data) {
          loadedPipelines = res.data.data;
        } else if (res.data?.pipelines) {
          loadedPipelines = res.data.pipelines;
        }

        // If no pipelines, use default
        if (loadedPipelines.length === 0) {
          loadedPipelines = [{
            id: 'default',
            name: 'Pipeline de Ventas',
            is_default: true,
            stages: DEFAULT_STAGES,
          }];
        }

        setPipelines(loadedPipelines);

        const defaultPipe = loadedPipelines.find(p => p.is_default) || loadedPipelines[0];
        setSelectedPipelineId(defaultPipe.id);

      } catch (error) {
        console.error('Error loading pipelines:', error);
        // Use default pipeline on error
        setPipelines([{
          id: 'default',
          name: 'Pipeline de Ventas',
          is_default: true,
          stages: DEFAULT_STAGES,
        }]);
        setSelectedPipelineId('default');
      } finally {
        setLoading(false);
      }
    };

    fetchPipelines();
  }, []);

  // Active pipeline & stages
  const activePipeline = pipelines.find(p => p.id === selectedPipelineId);
  const stages = activePipeline?.stages || DEFAULT_STAGES;

  // Filter leads
  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return leads;
    const query = searchQuery.toLowerCase();
    return leads.filter(lead =>
      lead.name?.toLowerCase().includes(query) ||
      lead.whatsapp_number?.includes(query) ||
      lead.email?.toLowerCase().includes(query) ||
      lead.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }, [leads, searchQuery]);

  // Group leads by stage
  const leadsByStage = useMemo(() => {
    const map = {};
    stages.forEach(s => (map[s.id] = []));

    filteredLeads.forEach(lead => {
      const stageId = lead.stage_id || stages[0]?.id;
      if (stageId && map[stageId]) {
        map[stageId].push(lead);
      } else if (stages.length > 0) {
        map[stages[0].id].push(lead);
      }
    });

    return map;
  }, [filteredLeads, stages]);

  // Drag handlers
  const handleDragStart = (event) => {
    const { active } = event;
    const type = active.data.current?.type;
    const item = active.data.current?.lead || active.data.current?.stage;
    setActiveDragItem({ type, item });
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (!over) return;

    // Reorder stages
    if (active.data.current?.type === 'STAGE' && over.data.current?.type === 'STAGE') {
      const activeId = active.id;
      const overId = over.id;
      if (activeId === overId) return;

      setPipelines(prev =>
        prev.map(p => {
          if (p.id !== selectedPipelineId) return p;
          const oldIndex = (p.stages || []).findIndex(s => s.id === activeId);
          const newIndex = (p.stages || []).findIndex(s => s.id === overId);
          if (oldIndex < 0 || newIndex < 0) return p;
          return { ...p, stages: arrayMove(p.stages, oldIndex, newIndex) };
        })
      );
      return;
    }

    // Move lead
    if (active.data.current?.type === 'LEAD') {
      const activeLeadId = active.id;
      let newStageId = null;

      if (over.data.current?.type === 'STAGE') {
        newStageId = over.id;
      } else if (over.data.current?.type === 'LEAD') {
        const overLead = leads.find(l => l.id === over.id);
        newStageId = overLead?.stage_id ?? null;
      }

      if (!newStageId) return;

      // Optimistic update
      setLeads(prev =>
        prev.map(l => (l.id === activeLeadId ? { ...l, stage_id: newStageId } : l))
      );

      // Persist to backend
      try {
        await api.put(`/api/leads/${activeLeadId}`, { stage_id: newStageId });
      } catch (err) {
        console.error('Failed to update lead stage:', err);
        // Revert on error
        setLeads(prev =>
          prev.map(l => (l.id === activeLeadId ? { ...l, stage_id: active.data.current.lead.stage_id } : l))
        );
      }
    }
  };

  // Handle lead stage update from modal
  const handleUpdateStage = async (leadId, stageId) => {
    setLeads(prev =>
      prev.map(l => (l.id === leadId ? { ...l, stage_id: stageId } : l))
    );

    try {
      await api.put(`/api/leads/${leadId}`, { stage_id: stageId });
    } catch (err) {
      console.error('Failed to update lead stage:', err);
    }
  };

  // Handle assign
  const handleAssignLead = async (leadId) => {
    try {
      await assignLead(leadId);
      setSelectedLead(null);
    } catch (error) {
      console.error('Error assigning lead:', error);
    }
  };

  // Refresh leads
  const handleRefresh = () => {
    // Trigger re-fetch from context or API
    window.location.reload();
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="p-4 md:p-6 h-full flex flex-col bg-slate-950">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-100">Pipeline</h2>
          
          {/* Pipeline Selector */}
          <select
            value={selectedPipelineId || ''}
            onChange={(e) => setSelectedPipelineId(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            {pipelines.map(p => (
              <option key={p.id} value={p.id}>
                {p.name || `Pipeline ${p.id}`}
              </option>
            ))}
          </select>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
            title="Actualizar"
          >
            <RefreshIcon />
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <SearchIcon />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar leads..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
      </div>

      {/* Stats */}
      <PipelineStats stages={stages} leadsByStage={leadsByStage} leads={filteredLeads} />

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto pb-4">
          <SortableContext items={stages.map(s => s.id)} strategy={horizontalListSortingStrategy}>
            <div className="flex gap-4 min-h-[400px]">
              {stages.map(stage => {
                const stageLeads = leadsByStage[stage.id] || [];
                return (
                  <SortableStage
                    key={stage.id}
                    stage={stage}
                    leads={stageLeads}
                    onLeadClick={setSelectedLead}
                  >
                    {stageLeads.map(lead => (
                      <SortableLead
                        key={lead.id}
                        lead={lead}
                        onClick={setSelectedLead}
                      />
                    ))}
                  </SortableStage>
                );
              })}
            </div>
          </SortableContext>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeDragItem?.type === 'LEAD' && activeDragItem.item && (
            <div className="w-72 bg-slate-800 p-3 rounded-xl shadow-2xl border border-blue-500/50">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getScoreBgGradient(activeDragItem.item.score)} flex items-center justify-center text-white text-xs font-semibold`}>
                  {getInitials(activeDragItem.item.name || activeDragItem.item.whatsapp_number)}
                </div>
                <div>
                  <p className="font-medium text-slate-100 text-sm truncate">
                    {activeDragItem.item.name || activeDragItem.item.whatsapp_number}
                  </p>
                  <p className="text-xs text-slate-400">Moviendo...</p>
                </div>
              </div>
            </div>
          )}
          {activeDragItem?.type === 'STAGE' && activeDragItem.item && (
            <div className="w-72 bg-slate-800 p-3 rounded-xl shadow-2xl border border-blue-500/50">
              <p className="font-bold text-slate-100">{activeDragItem.item.name}</p>
              <p className="text-xs text-slate-400">Reordenando...</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onAssign={handleAssignLead}
          onUpdateStage={handleUpdateStage}
          stages={stages}
          user={user}
        />
      )}
    </div>
  );
}