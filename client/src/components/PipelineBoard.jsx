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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';

// --- STAGE COLUMN COMPONENT ---
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex-shrink-0 w-80 bg-gray-100 rounded-lg p-2 mr-4 flex flex-col max-h-full"
    >
      <div
        {...attributes}
        {...listeners}
        className="p-2 font-bold text-gray-700 flex justify-between items-center cursor-grab active:cursor-grabbing border-b border-gray-200 mb-2"
        style={{ borderTop: `4px solid ${stage.color || '#ccc'}` }}
      >
        <span>{stage.name}</span>
        <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">{leads.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-1 space-y-2 min-h-[100px]">
         <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
            {children}
         </SortableContext>
      </div>
    </div>
  );
}

// --- LEAD CARD COMPONENT ---
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-3 rounded shadow-sm border border-gray-200 hover:shadow-md cursor-grab active:cursor-grabbing text-left"
    >
      <div className="flex justify-between items-start mb-1">
          <h4 className="font-semibold text-sm text-gray-800 truncate">{lead.name || lead.whatsapp_number}</h4>
          {lead.score > 0 && (
             <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">{lead.score}%</span>
          )}
      </div>
      <p className="text-xs text-gray-500 mb-2 truncate">
         {lead.last_message_at ? new Date(lead.last_message_at).toLocaleDateString() : ''}
      </p>
      {lead.tags && lead.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
              {lead.tags.slice(0, 2).map((tag, i) => (
                  <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-1 rounded">{tag}</span>
              ))}
          </div>
      )}
    </div>
  );
}

// --- MAIN BOARD COMPONENT ---
export default function PipelineBoard() {
  const { t } = useTranslation();
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState(null);
  const [leads, setLeads] = useState([]);
  const [activeDragItem, setActiveDragItem] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // 1. Fetch Pipelines & Leads
   // 1. Fetch Pipelines & Leads (CORREGIDO)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pipelinesRes, leadsRes] = await Promise.all([
          api.get('/pipelines'),
          api.get('/initial-data')
        ]);

        console.log("Respuesta API Pipelines:", pipelinesRes); // Para depuración

        // CORRECCIÓN: Asegurar que loadedPipelines sea siempre un Array
        // Muchas APIs devuelven { data: [...] } o { pipelines: [...] }
        let loadedPipelines = [];
        
        if (Array.isArray(pipelinesRes.data)) {
            loadedPipelines = pipelinesRes.data;
        } else if (pipelinesRes.data && Array.isArray(pipelinesRes.data.data)) {
            loadedPipelines = pipelinesRes.data.data;
        } else if (pipelinesRes.data && Array.isArray(pipelinesRes.data.pipelines)) {
            loadedPipelines = pipelinesRes.data.pipelines;
        }

        setPipelines(loadedPipelines);
        
        // Select default or first pipeline
        if (loadedPipelines.length > 0 && !selectedPipelineId) {
            const defaultPipe = loadedPipelines.find(p => p.is_default) || loadedPipelines[0];
            setSelectedPipelineId(defaultPipe.id);
        }

        // CORRECCIÓN: Validación similar para Leads
        const leadsData = leadsRes.data || {};
        const allLeads = Array.isArray(leadsData.leads) ? leadsData.leads : [];
        setLeads(allLeads);

      } catch (error) {
        console.error("Error loading board data", error);
        // Evitar que la pantalla se rompa si falla la API
        setPipelines([]); 
        setLeads([]);
      }
    };
    fetchData();
  }, []);

  // 2. Derive Board State
    const activePipeline = Array.isArray(pipelines) 
      ? pipelines.find(p => p.id === selectedPipelineId) 
      : null;

  const stages = activePipeline ? activePipeline.stages : [];
  
  // Group leads by stage
  const leadsByStage = React.useMemo(() => {
      const map = {};
      stages.forEach(s => map[s.id] = []);
      
      leads.forEach(lead => {
          // If lead has no stage, put in first stage
          const stageId = lead.stage_id || (stages[0]?.id);
          if (map[stageId]) {
              map[stageId].push(lead);
          } else if (stages.length > 0) {
              // Fallback to first stage if invalid stage_id
              map[stages[0].id].push(lead);
          }
      });
      return map;
  }, [leads, stages]);


  // 3. Drag Handlers
  const handleDragStart = (event) => {
    const { active } = event;
    const type = active.data.current?.type;
    const item = active.data.current?.lead || active.data.current?.stage;
    setActiveDragItem({ type, item });
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    
    // Only handling Lead drag over here for visual updates
    // Actual move logic is in DragEnd for simplicity/persistence
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
            const overLead = leads.find(l => l.id === overId);
            newStageId = overLead?.stage_id || stages[0].id;
        }

        if (newStageId) {
            // Optimistic Update
            setLeads(prev => prev.map(l => {
                if (l.id === activeLeadId) {
                    return { ...l, stage_id: newStageId };
                }
                return l;
            }));

            // API Call
            try {
                await api.post(`/leads/${activeLeadId}/move`, {
                    pipelineId: selectedPipelineId,
                    stageId: newStageId
                });
            } catch (error) {
                console.error("Failed to move lead", error);
                // Revert optimistic update (todo)
            }
        }
    }
  };

  if (!activePipeline) return <div className="p-8 text-center text-gray-500">Loading Pipeline...</div>;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header / Pipeline Selector */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center space-x-4">
             <h2 className="text-xl font-bold text-gray-800">{activePipeline.name}</h2>
             {pipelines.length > 1 && (
                 <select 
                    value={selectedPipelineId} 
                    onChange={(e) => setSelectedPipelineId(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                 >
                     {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                 </select>
             )}
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 text-sm">
            + New Lead
        </button>
      </div>

      {/* Board Area */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto p-4 flex items-start space-x-4">
           {stages.map(stage => (
               <SortableStage key={stage.id} stage={stage} leads={leadsByStage[stage.id] || []}>
                   {(leadsByStage[stage.id] || []).map(lead => (
                       <SortableLead key={lead.id} lead={lead} />
                   ))}
               </SortableStage>
           ))}
        </div>

        <DragOverlay>
            {activeDragItem?.type === 'LEAD' ? (
                <div className="bg-white p-3 rounded shadow-lg border border-blue-500 w-64 opacity-90 transform rotate-3">
                    <h4 className="font-semibold text-sm">{activeDragItem.item.name || activeDragItem.item.whatsapp_number}</h4>
                </div>
            ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}