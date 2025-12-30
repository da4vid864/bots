import React, { useState, useEffect } from 'react';
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
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';

// Icons
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

// --- ENHANCED STAGE COLUMN COMPONENT ---
function SortableStage({ stage, leads, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: stage.id, data: { type: 'STAGE', stage } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getStageTypeColor = (type) => {
    switch (type) {
      case 'WON': return 'bg-green-100 text-green-800 border-green-200';
      case 'LOST': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const stageTypeClass = getStageTypeColor(stage.type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex-shrink-0 w-full sm:w-80 bg-white rounded-lg shadow-sm border border-gray-200 p-3 mr-4 flex flex-col max-h-full"
      role="region"
      aria-label={`Stage: ${stage.name} with ${leads.length} leads`}
    >
      <div
        {...attributes}
        {...listeners}
        className="p-3 font-bold text-gray-800 flex justify-between items-center cursor-grab active:cursor-grabbing border-b border-gray-200 mb-3 rounded-t-lg hover:bg-gray-50 transition-colors"
        style={{ 
          borderTop: `4px solid ${stage.color || '#3b82f6'}`,
          backgroundColor: `${stage.color || '#3b82f6'}08`
        }}
      >
        <div className="flex items-center space-x-2 min-w-0">
          <span className="truncate">{stage.name}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${stageTypeClass}`}>
            {stage.type === 'WON' ? 'Won' : stage.type === 'LOST' ? 'Lost' : 'Open'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span 
            className="text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded-full min-w-[2rem] text-center font-medium"
            aria-label={`${leads.length} leads`}
          >
            {leads.length}
          </span>
        </div>
      </div>
      <div 
        className="flex-1 overflow-y-auto p-1 space-y-3 min-h-[120px]"
        aria-live="polite"
        aria-atomic="true"
      >
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {children}
        </SortableContext>
        
        {leads.length === 0 && (
          <div 
            className="text-center py-6 text-gray-400 text-sm italic"
            aria-label="No leads in this stage"
          >
            No leads in this stage
          </div>
        )}
      </div>
      <button
        className="mt-3 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 py-2 rounded border border-dashed border-gray-300 flex items-center justify-center transition-colors"
        onClick={() => {/* Add lead to this stage */}}
        aria-label={`Add new lead to ${stage.name}`}
      >
        <AddIcon />
        <span className="ml-2">Add lead</span>
      </button>
    </div>
  );
}

// --- ENHANCED LEAD CARD COMPONENT ---
function SortableLead({ lead }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: lead.id, data: { type: 'LEAD', lead } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-4 rounded-lg shadow-xs border border-gray-200 hover:shadow-md hover:border-blue-300 cursor-grab active:cursor-grabbing text-left transition-all duration-200 group"
      role="button"
      tabIndex={0}
      aria-label={`Lead: ${lead.name || lead.whatsapp_number}, score: ${lead.score || 0}%, last contact: ${formatDate(lead.last_message_at)}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          // Handle lead click
        }
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div 
            className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-medium text-sm flex-shrink-0"
            aria-hidden="true"
          >
            {getInitials(lead.name || lead.whatsapp_number)}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-gray-900 truncate text-sm">
              {lead.name || lead.whatsapp_number}
            </h4>
            {lead.email && (
              <p className="text-xs text-gray-500 truncate mt-0.5">{lead.email}</p>
            )}
          </div>
        </div>
        {lead.score > 0 && (
          <span 
            className={`text-xs font-medium px-2 py-1 rounded-full border ${getScoreColor(lead.score)} flex-shrink-0`}
            aria-label={`Score: ${lead.score}%`}
          >
            {lead.score}%
          </span>
        )}
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <span className="flex items-center">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {formatDate(lead.last_message_at)}
        </span>
        {lead.assigned_to && (
          <span 
            className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs border border-purple-100"
            aria-label={`Assigned to: ${lead.assigned_to}`}
          >
            {lead.assigned_to.split('@')[0]}
          </span>
        )}
      </div>
      
      {lead.tags && lead.tags.length > 0 && (
        <div className="flex flex-wrap gap-1" aria-label="Tags">
          {lead.tags.slice(0, 3).map((tag, i) => (
            <span 
              key={i} 
              className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full border border-gray-200"
            >
              {tag}
            </span>
          ))}
          {lead.tags.length > 3 && (
            <span 
              className="text-[10px] text-gray-400"
              aria-label={`${lead.tags.length - 3} more tags`}
            >
              +{lead.tags.length - 3}
            </span>
          )}
        </div>
      )}
      
      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          onClick={(e) => {
            e.stopPropagation();
            // Quick assign action
          }}
          aria-label="Assign lead"
        >
          Assign
        </button>
        <button 
          className="text-xs text-gray-600 hover:text-gray-800 font-medium"
          onClick={(e) => {
            e.stopPropagation();
            // Add note action
          }}
          aria-label="Add note"
        >
          Note
        </button>
        <button 
          className="text-xs text-green-600 hover:text-green-800 font-medium"
          onClick={(e) => {
            e.stopPropagation();
            // View details action
          }}
          aria-label="View details"
        >
          View
        </button>
      </div>
    </div>
  );
}

// --- PIPELINE STATS COMPONENT ---
function PipelineStats({ stages, leadsByStage }) {
  const totalLeads = Object.values(leadsByStage).reduce((sum, leads) => sum + leads.length, 0);
  const wonLeads = stages
    .filter(s => s.type === 'WON')
    .reduce((sum, stage) => sum + (leadsByStage[stage.id]?.length || 0), 0);
  const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
        <div className="text-sm text-gray-500 mb-1">Total Leads</div>
        <div className="text-xl md:text-2xl font-bold text-gray-900">{totalLeads}</div>
      </div>
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
        <div className="text-sm text-gray-500 mb-1">Won Leads</div>
        <div className="text-xl md:text-2xl font-bold text-green-600">{wonLeads}</div>
      </div>
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
        <div className="text-sm text-gray-500 mb-1">Conversion</div>
        <div className="text-xl md:text-2xl font-bold text-blue-600">{conversionRate}%</div>
      </div>
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
        <div className="text-sm text-gray-500 mb-1">Active Stages</div>
        <div className="text-xl md:text-2xl font-bold text-purple-600">{stages.length}</div>
      </div>
    </div>
  );
}

// --- MAIN ENHANCED BOARD COMPONENT ---
export default function PipelineBoardEnhanced() {
  const { t } = useTranslation();
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState(null);
  const [leads, setLeads] = useState([]);
  const [activeDragItem, setActiveDragItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [pipelinesRes, leadsRes] = await Promise.all([
          api.get('/pipelines'),
          api.get('/initial-data')
        ]);

        let loadedPipelines = [];
        if (Array.isArray(pipelinesRes.data)) {
          loadedPipelines = pipelinesRes.data;
        } else if (pipelinesRes.data && Array.isArray(pipelinesRes.data.data)) {
          loadedPipelines = pipelinesRes.data.data;
        } else if (pipelinesRes.data && Array.isArray(pipelinesRes.data.pipelines)) {
          loadedPipelines = pipelinesRes.data.pipelines;
        }

        setPipelines(loadedPipelines);
        
        if (loadedPipelines.length > 0 && !selectedPipelineId) {
          const defaultPipe = loadedPipelines.find(p => p.is_default) || loadedPipelines[0];
          setSelectedPipelineId(defaultPipe.id);
        }

        const leadsData = leadsRes.data || {};
        const allLeads = Array.isArray(leadsData.leads) ? leadsData.leads : [];
        setLeads(allLeads);

      } catch (error) {
        console.error("Error loading board data", error);
        setPipelines([]);
        setLeads([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Get active pipeline and stages
  const activePipeline = pipelines.find(p => p.id === selectedPipelineId);
  const stages = activePipeline ? activePipeline.stages : [];

  // Filter leads based on search
  const filteredLeads = React.useMemo(() => {
    if (!searchQuery.trim()) return leads;
    
    const query = searchQuery.toLowerCase();
    return leads.filter(lead => 
      (lead.name && lead.name.toLowerCase().includes(query)) ||
      (lead.whatsapp_number && lead.whatsapp_number.includes(query)) ||
      (lead.email && lead.email.toLowerCase().includes(query)) ||
      (lead.tags && lead.tags.some(tag => tag.toLowerCase().includes(query)))
    );
  }, [leads, searchQuery]);

  // Group leads by stage
  const leadsByStage = React.useMemo(() => {
    const map = {};
    stages.forEach(s => map[s.id] = []);
    
    filteredLeads.forEach(lead => {
      const stageId = lead.stage_id || (stages[0]?.id);
      if (map[stageId]) {
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

    // --- Handling Lead Drop ---
    if (active.data.current?.type === 'LEAD') {
      const activeLeadId = active.id;
      const overId = over.id;

      // Find source and destination stages
      let newStageId = null;
      
      // Did we drop on a Stage column directly?
      if (over.data.current?.type === 'STAGE') {
        newStageId = over.id;
      } 
      // Did we drop on another Lead?
      else if (over.data.current?.type === 'LEAD') {
        const overLead = leads.find(l => l.id === overimport {
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
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';

// Icons
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

// --- ENHANCED STAGE COLUMN COMPONENT ---
function SortableStage({ stage, leads, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: stage.id, data: { type: 'STAGE', stage } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getStageTypeColor = (type) => {
    switch (type) {
      case 'WON': return 'bg-green-100 text-green-800 border-green-200';
      case 'LOST': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const stageTypeClass = getStageTypeColor(stage.type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex-shrink-0 w-full sm:w-80 bg-white rounded-lg shadow-sm border border-gray-200 p-3 mr-4 flex flex-col max-h-full"
      role="region"
      aria-label={`Stage: ${stage.name} with ${leads.length} leads`}
    >
      <div
        {...attributes}
        {...listeners}
        className="p-3 font-bold text-gray-800 flex justify-between items-center cursor-grab active:cursor-grabbing border-b border-gray-200 mb-3 rounded-t-lg hover:bg-gray-50 transition-colors"
        style={{ 
          borderTop: `4px solid ${stage.color || '#3b82f6'}`,
          backgroundColor: `${stage.color || '#3b82f6'}08`
        }}
      >
        <div className="flex items-center space-x-2 min-w-0">
          <span className="truncate">{stage.name}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${stageTypeClass}`}>
            {stage.type === 'WON' ? 'Won' : stage.type === 'LOST' ? 'Lost' : 'Open'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span 
            className="text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded-full min-w-[2rem] text-center font-medium"
            aria-label={`${leads.length} leads`}
          >
            {leads.length}
          </span>
        </div>
      </div>
      <div 
        className="flex-1 overflow-y-auto p-1 space-y-3 min-h-[120px]"
        aria-live="polite"
        aria-atomic="true"
      >
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {children}
        </SortableContext>
        
        {leads.length === 0 && (
          <div 
            className="text-center py-6 text-gray-400 text-sm italic"
            aria-label="No leads in this stage"
          >
            No leads in this stage
          </div>
        )}
      </div>
      <button
        className="mt-3 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 py-2 rounded border border-dashed border-gray-300 flex items-center justify-center transition-colors"
        onClick={() => {/* Add lead to this stage */}}
        aria-label={`Add new lead to ${stage.name}`}
      >
        <AddIcon />
        <span className="ml-2">Add lead</span>
      </button>
    </div>
  );
}

// --- ENHANCED LEAD CARD COMPONENT ---
function SortableLead({ lead }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: lead.id, data: { type: 'LEAD', lead } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-4 rounded-lg shadow-xs border border-gray-200 hover:shadow-md hover:border-blue-300 cursor-grab active:cursor-grabbing text-left transition-all duration-200 group"
      role="button"
      tabIndex={0}
      aria-label={`Lead: ${lead.name || lead.whatsapp_number}, score: ${lead.score || 0}%, last contact: ${formatDate(lead.last_message_at)}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          // Handle lead click
        }
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div 
            className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-medium text-sm flex-shrink-0"
            aria-hidden="true"
          >
            {getInitials(lead.name || lead.whatsapp_number)}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-gray-900 truncate text-sm">
              {lead.name || lead.whatsapp_number}
            </h4>
            {lead.email && (
              <p className="text-xs text-gray-500 truncate mt-0.5">{lead.email}</p>
            )}
          </div>
        </div>
        {lead.score > 0 && (
          <span 
            className={`text-xs font-medium px-2 py-1 rounded-full border ${getScoreColor(lead.score)} flex-shrink-0`}
            aria-label={`Score: ${lead.score}%`}
          >
            {lead.score}%
          </span>
        )}
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <span className="flex items-center">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {formatDate(lead.last_message_at)}
        </span>
        {lead.assigned_to && (
          <span 
            className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs border border-purple-100"
            aria-label={`Assigned to: ${lead.assigned_to}`}
          >
            {lead.assigned_to.split('@')[0]}
          </span>
        )}
      </div>
      
      {lead.tags && lead.tags.length > 0 && (
        <div className="flex flex-wrap gap-1" aria-label="Tags">
          {lead.tags.slice(0, 3).map((tag, i) => (
            <span 
              key={i} 
              className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full border border-gray-200"
            >
              {tag}
            </span>
          ))}
          {lead.tags.length > 3 && (
            <span 
              className="text-[10px] text-gray-400"
              aria-label={`${lead.tags.length - 3} more tags`}
            >
              +{lead.tags.length - 3}
            </span>
          )}
        </div>
      )}
      
      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          onClick={(e) => {
            e.stopPropagation();
            // Quick assign action
          }}
          aria-label="Assign lead"
        >
          Assign
        </button>
        <button 
          className="text-xs text-gray-600 hover:text-gray-800 font-medium"
          onClick={(e) => {
            e.stopPropagation();
            // Add note action
          }}
          aria-label="Add note"
        >
          Note
        </button>
        <button 
          className="text-xs text-green-600 hover:text-green-800 font-medium"
          onClick={(e) => {
            e.stopPropagation();
            // View details action
          }}
          aria-label="View details"
        >
          View
        </button>
      </div>
    </div>
  );
}

// --- PIPELINE STATS COMPONENT ---
function PipelineStats({ stages, leadsByStage }) {
  const totalLeads = Object.values(leadsByStage).reduce((sum, leads) => sum + leads.length, 0);
  const wonLeads = stages
    .filter(s => s.type === 'WON')
    .reduce((sum, stage) => sum + (leadsByStage[stage.id]?.length || 0), 0);
  const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
        <div className="text-sm text-gray-500 mb-1">Total Leads</div>
        <div className="text-xl md:text-2xl font-bold text-gray-900">{totalLeads}</div>
      </div>
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
        <div className="text-sm text-gray-500 mb-1">Won Leads</div>
        <div className="text-xl md:text-2xl font-bold text-green-600">{wonLeads}</div>
      </div>
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
        <div className="text-sm text-gray-500 mb-1">Conversion</div>
        <div className="text-xl md:text-2xl font-bold text-blue-600">{conversionRate}%</div>
      </div>
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
        <div className="text-sm text-gray-500 mb-1">Active Stages</div>
        <div className="text-xl md:text-2xl font-bold text-purple-600">{stages.length}</div>
      </div>
    </div>
  );
}

// --- MAIN ENHANCED BOARD COMPONENT ---
export default function PipelineBoardEnhanced() {
  const { t } = useTranslation();
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState(null);
  const [leads, setLeads] = useState([]);
  const [activeDragItem, setActiveDragItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [pipelinesRes, leadsRes] = await Promise.all([
          api.get('/pipelines'),
          api.get('/initial-data')
        ]);

        let loadedPipelines = [];
        if (Array.isArray(pipelinesRes.data)) {
          loadedPipelines = pipelinesRes.data;
        } else if (pipelinesRes.data && Array.isArray(pipelinesRes.data.data)) {
          loadedPipelines = pipelinesRes.data.data;
        } else if (pipelinesRes.data && Array.isArray(pipelinesRes.data.pipelines)) {
          loadedPipelines = pipelinesRes.data.pipelines;
        }

        setPipelines(loadedPipelines);
        
        if (loadedPipelines.length > 0 && !selectedPipelineId) {
          const defaultPipe = loadedPipelines.find(p => p.is_default) || loadedPipelines[0];
          setSelectedPipelineId(defaultPipe.id);
        }

        const leadsData = leadsRes.data || {};
        const allLeads = Array.isArray(leadsData.leads) ? leadsData.leads : [];
        setLeads(allLeads);

      } catch (error) {
        console.error("Error loading board data", error);
        setPipelines([]);
        setLeads([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Get active pipeline and stages
  const activePipeline = pipelines.find(p => p.id === selectedPipelineId);
  const stages = activePipeline ? activePipeline.stages : [];

  // Filter leads based on search
  const filteredLeads = React.useMemo(() => {
    if (!searchQuery.trim()) return leads;
    
    const query = searchQuery.toLowerCase();
    return leads.filter(lead => 
      (lead.name && lead.name.toLowerCase().includes(query)) ||
      (lead.whatsapp_number && lead.whatsapp_number.includes(query)) ||
      (lead.email && lead.email.toLowerCase().includes(query)) ||
      (lead.tags && lead.tags.some(tag => tag.toLowerCase().includes(query)))
    );
  }, [leads, searchQuery]);

  // Group leads by stage
  const leadsByStage = React.useMemo(() => {
    const map = {};
    stages.forEach(s => map[s.id] = []);
    
    filteredLeads.forEach(lead => {
      const stageId = lead.stage_id || (stages[0]?.id);
      if (map[stageId]) {
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

    // --- Handling Lead Drop ---
    if (active.data.current?.type === 'LEAD') {
      const activeLeadId = active.id;
      const overId = over.id;

      // Find source and destination stages
      let newStageId = null;
      
      // Did we drop on a Stage column directly?
      if (over.data.current?.type === 'STAGE') {
        newStageId = over.id;
      } 
      // Did we drop on another Lead?
      else if (over.data.current?.type === 'LEAD') {
        const overLead = leads.find(l => l.id === over
