import React, { useState, useEffect, useMemo } from 'react';
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

const ClockIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const GripIcon = () => (
  <svg className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
    <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
  </svg>
);

// ===== HELPERS =====
const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);
};

const formatDate = (dateString) => {
  if (!dateString) return 'No contact';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'Invalid date';
  }
};

const getScoreColor = (score) => {
  if (score >= 80) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  if (score >= 50) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  return 'bg-slate-700 text-slate-400 border-slate-600';
};

const getStageTypeColor = (type) => {
  switch (type) {
    case 'WON':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'LOST':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  }
};

// ===== SORTABLE LEAD CARD =====
function SortableLead({ lead }) {
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
      className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 hover:border-blue-500/50 cursor-grab active:cursor-grabbing transition-all duration-200 group hover:shadow-lg hover:shadow-blue-500/10"
      role="button"
      tabIndex={0}
      aria-label={`Lead: ${displayName}, score: ${lead.score || 0}%`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {getInitials(displayName)}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-slate-100 truncate text-sm">{displayName}</h4>
            {lead.email && (
              <p className="text-xs text-slate-500 truncate mt-0.5">{lead.email}</p>
            )}
          </div>
        </div>
        {lead.score > 0 && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full border ${getScoreColor(lead.score)}`}>
            {lead.score}%
          </span>
        )}
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
        <span className="flex items-center gap-1">
          <ClockIcon />
          {formatDate(lead.last_message_at)}
        </span>
        {lead.assigned_to && (
          <span className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded text-xs border border-purple-500/30">
            {lead.assigned_to.split('@')[0]}
          </span>
        )}
      </div>

      {/* Tags */}
      {lead.tags && lead.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {lead.tags.slice(0, 3).map((tag, i) => (
            <span key={i} className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full border border-slate-600">
              {tag}
            </span>
          ))}
          {lead.tags.length > 3 && (
            <span className="text-[10px] text-slate-500">+{lead.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Actions (visible on hover) */}
      <div className="pt-3 border-t border-slate-700/50 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          Assign
        </button>
        <button
          className="text-xs text-slate-400 hover:text-slate-300 font-medium transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          Note
        </button>
        <button
          className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          View
        </button>
      </div>
    </div>
  );
}

// ===== SORTABLE STAGE COLUMN =====
function SortableStage({ stage, leads, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: stage.id,
    data: { type: 'STAGE', stage },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const stageTypeLabel = stage.type === 'WON' ? 'Won' : stage.type === 'LOST' ? 'Lost' : 'Open';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex-shrink-0 w-80 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col max-h-full"
      role="region"
      aria-label={`Stage: ${stage.name} with ${leads.length} leads`}
    >
      {/* Stage Header */}
      <div
        {...attributes}
        {...listeners}
        className="p-4 flex justify-between items-center cursor-grab active:cursor-grabbing border-b border-slate-800 hover:bg-slate-800/50 transition-colors rounded-t-xl"
        style={{ borderLeft: `4px solid ${stage.color || '#3b82f6'}` }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <GripIcon />
          <span className="font-semibold text-slate-100 truncate">{stage.name}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${getStageTypeColor(stage.type)}`}>
            {stageTypeLabel}
          </span>
        </div>
        <span className="text-sm bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full font-medium">
          {leads.length}
        </span>
      </div>

      {/* Leads List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[150px]">
        <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {children}
        </SortableContext>

        {leads.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-sm">
            No leads in this stage
          </div>
        )}
      </div>

      {/* Add Lead Button */}
      <button
        className="m-3 mt-0 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 py-2.5 rounded-lg border border-dashed border-slate-700 hover:border-slate-600 flex items-center justify-center transition-all"
        aria-label={`Add new lead to ${stage.name}`}
      >
        <AddIcon />
        <span className="ml-2">Add lead</span>
      </button>
    </div>
  );
}

// ===== PIPELINE STATS =====
function PipelineStats({ stages, leadsByStage }) {
  const totalLeads = Object.values(leadsByStage).reduce((sum, ls) => sum + ls.length, 0);
  const wonLeads = stages
    .filter((s) => s.type === 'WON')
    .reduce((sum, stage) => sum + (leadsByStage[stage.id]?.length || 0), 0);
  const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

  const stats = [
    { label: 'Total Leads', value: totalLeads, color: 'text-slate-100' },
    { label: 'Won Leads', value: wonLeads, color: 'text-emerald-400' },
    { label: 'Conversion', value: `${conversionRate}%`, color: 'text-blue-400' },
    { label: 'Active Stages', value: stages.length, color: 'text-purple-400' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {stats.map((stat, i) => (
        <div key={i} className="bg-slate-800/60 p-4 rounded-xl border border-slate-700">
          <div className="text-sm text-slate-400 mb-1">{stat.label}</div>
          <div className={`text-xl md:text-2xl font-bold ${stat.color}`}>{stat.value}</div>
        </div>
      ))}
    </div>
  );
}

// ===== LOADING SKELETON =====
function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-slate-800 rounded-xl" />
        ))}
      </div>
      <div className="flex gap-4 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-80 h-96 bg-slate-800 rounded-xl flex-shrink-0" />
        ))}
      </div>
    </div>
  );
}

// ===== MAIN COMPONENT =====
export default function PipelineBoardEnhanced() {
  const { t } = useTranslation();
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState(null);
  const [leads, setLeads] = useState([]);
  const [activeDragItem, setActiveDragItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [pipelinesRes, leadsRes] = await Promise.all([
          api.get('/api/pipelines'),
          api.get('/api/initial-data'),
        ]);

        // Parse pipelines
        let loadedPipelines = [];
        if (Array.isArray(pipelinesRes.data)) {
          loadedPipelines = pipelinesRes.data;
        } else if (pipelinesRes.data?.data) {
          loadedPipelines = pipelinesRes.data.data;
        } else if (pipelinesRes.data?.pipelines) {
          loadedPipelines = pipelinesRes.data.pipelines;
        }

        setPipelines(loadedPipelines);

        if (loadedPipelines.length > 0) {
          const defaultPipe = loadedPipelines.find((p) => p.is_default) || loadedPipelines[0];
          setSelectedPipelineId((prev) => prev ?? defaultPipe.id);
        }

        // Parse leads
        const leadsData = leadsRes.data || {};
        setLeads(Array.isArray(leadsData.leads) ? leadsData.leads : []);
      } catch (err) {
        console.error('Error loading board data', err);
        setError('Failed to load pipeline data');
        setPipelines([]);
        setLeads([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Active pipeline & stages
  const activePipeline = pipelines.find((p) => p.id === selectedPipelineId);
  const stages = activePipeline?.stages || [];

  // Filter leads
  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return leads;
    const query = searchQuery.toLowerCase();
    return leads.filter(
      (lead) =>
        lead.name?.toLowerCase().includes(query) ||
        String(lead.whatsapp_number).includes(query) ||
        lead.email?.toLowerCase().includes(query) ||
        lead.tags?.some((tag) => String(tag).toLowerCase().includes(query))
    );
  }, [leads, searchQuery]);

  // Group leads by stage
  const leadsByStage = useMemo(() => {
    const map = {};
    stages.forEach((s) => (map[s.id] = []));

    filteredLeads.forEach((lead) => {
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

      setPipelines((prev) =>
        prev.map((p) => {
          if (p.id !== selectedPipelineId) return p;
          const oldIndex = (p.stages || []).findIndex((s) => s.id === activeId);
          const newIndex = (p.stages || []).findIndex((s) => s.id === overId);
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
        const overLead = leads.find((l) => l.id === over.id);
        newStageId = overLead?.stage_id ?? null;
      }

      if (!newStageId) return;

      setLeads((prev) =>
        prev.map((l) => (l.id === activeLeadId ? { ...l, stage_id: newStageId } : l))
      );

      try {
        await api.put(`/api/leads/${activeLeadId}`, { stage_id: newStageId });
      } catch (err) {
        console.error('Failed to persist lead stage move', err);
      }
    }
  };

  // Loading state
  if (loading) return <LoadingSkeleton />;

  // Error state
  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Empty pipelines
  if (pipelines.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-200 mb-2">No pipelines found</h3>
        <p className="text-slate-400">Create your first pipeline to get started.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-100">
            {t('pipeline.title', 'Pipeline')}
          </h2>
          <select
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
            value={selectedPipelineId || ''}
            onChange={(e) => setSelectedPipelineId(e.target.value)}
            aria-label="Select pipeline"
          >
            {pipelines.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name || `Pipeline ${p.id}`}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <SearchIcon />
          </div>
          <input
            type="text"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads..."
            aria-label="Search leads"
          />
        </div>
      </div>

      {/* Stats */}
      <PipelineStats stages={stages} leadsByStage={leadsByStage} />

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto pb-4">
          <SortableContext items={stages.map((s) => s.id)} strategy={horizontalListSortingStrategy}>
            <div className="flex gap-4 min-h-[400px]">
              {stages.map((stage) => {
                const stageLeads = leadsByStage[stage.id] || [];
                return (
                  <SortableStage key={stage.id} stage={stage} leads={stageLeads}>
                    {stageLeads.map((lead) => (
                      <SortableLead key={lead.id} lead={lead} />
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
            <div className="w-72 bg-slate-800 p-4 rounded-xl shadow-2xl border border-blue-500/50">
              <div className="font-semibold text-slate-100 text-sm truncate">
                {activeDragItem.item.name || activeDragItem.item.whatsapp_number || 'Lead'}
              </div>
              <div className="text-xs text-slate-400 mt-1">Moving...</div>
            </div>
          )}
          {activeDragItem?.type === 'STAGE' && activeDragItem.item && (
            <div className="w-72 bg-slate-800 p-4 rounded-xl shadow-2xl border border-blue-500/50">
              <div className="font-bold text-slate-100 truncate">{activeDragItem.item.name}</div>
              <div className="text-xs text-slate-400 mt-1">Moving stage...</div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}