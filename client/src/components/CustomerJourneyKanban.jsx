import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import axios from 'axios';

const CustomerJourneyKanban = () => {
    const [leads, setLeads] = useState([]);
    const [columns, setColumns] = useState({
        'Nuevo': {
            id: 'Nuevo',
            title: 'Nuevo',
            leads: []
        },
        'Contactado': {
            id: 'Contactado',
            title: 'Contactado',
            leads: []
        },
        'Calificado': {
            id: 'Calificado',
            title: 'Calificado',
            leads: []
        },
        'Propuesta': {
            id: 'Propuesta',
            title: 'Propuesta',
            leads: []
        },
        'Cerrado': {
            id: 'Cerrado',
            title: 'Cerrado',
            leads: []
        }
    });

    useEffect(() => {
        const fetchLeads = async () => {
            try {
                const { data } = await axios.get('/api/leads', { withCredentials: true });
                setLeads(data);
                
                const newColumns = { ...columns };
                Object.keys(newColumns).forEach(key => newColumns[key].leads = []);

                data.forEach(lead => {
                    if (newColumns[lead.journey_stage]) {
                        newColumns[lead.journey_stage].leads.push(lead);
                    }
                });
                setColumns(newColumns);
            } catch (error) {
                console.error('Error fetching leads', error);
            }
        };
        fetchLeads();
    }, []);

    const onDragEnd = (result) => {
        const { source, destination, draggableId } = result;

        if (!destination) {
            return;
        }

        if (source.droppableId === destination.droppableId && source.index === destination.index) {
            return;
        }

        const start = columns[source.droppableId];
        const end = columns[destination.droppableId];
        const lead = leads.find(l => l.id.toString() === draggableId);

        if (start === end) {
            const newLeads = Array.from(start.leads);
            newLeads.splice(source.index, 1);
            newLeads.splice(destination.index, 0, lead);

            const newColumn = {
                ...start,
                leads: newLeads,
            };

            setColumns({
                ...columns,
                [newColumn.id]: newColumn,
            });
            return;
        }
        
        const startLeads = Array.from(start.leads);
        startLeads.splice(source.index, 1);
        const newStart = {
            ...start,
            leads: startLeads,
        };

        const endLeads = Array.from(end.leads);
        endLeads.splice(destination.index, 0, lead);
        const newEnd = {
            ...end,
            leads: endLeads,
        };

        setColumns({
            ...columns,
            [newStart.id]: newStart,
            [newEnd.id]: newEnd,
        });
        
        axios.put(`/api/leads/${lead.id}/journey-stage`, { journeyStage: newEnd.id }, { withCredentials: true })
            .catch(err => console.error('Error updating lead stage', err));
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {Object.values(columns).map(column => (
                    <Droppable key={column.id} droppableId={column.id}>
                        {(provided, snapshot) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                style={{
                                    background: snapshot.isDraggingOver ? 'lightblue' : 'lightgrey',
                                    padding: 4,
                                    width: 250,
                                    minHeight: 500
                                }}
                            >
                                <h2>{column.title}</h2>
                                {column.leads.map((lead, index) => (
                                    <Draggable key={lead.id} draggableId={lead.id.toString()} index={index}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                style={{
                                                    userSelect: 'none',
                                                    padding: 16,
                                                    margin: '0 0 8px 0',
                                                    minHeight: '50px',
                                                    backgroundColor: snapshot.isDragging ? '#263B4A' : '#456C86',
                                                    color: 'white',
                                                    ...provided.draggableProps.style
                                                }}
                                            >
                                                {lead.name}
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                ))}
            </div>
        </DragDropContext>
    );
};

export default CustomerJourneyKanban;
