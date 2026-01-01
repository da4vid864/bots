import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { leadsApi, pipelineApi, metricsApi } from '../utils/salesApi';
import useRealtime from '../hooks/useRealtime';

// Initial state
const initialState = {
  leads: [],
  pipelineLeads: {},
  stages: [],
  selectedLead: null,
  conversations: [],
  metrics: null,
  loading: false,
  error: null,
  filters: {
    search: '',
    stage: null,
    assignedTo: null,
    scoreRange: [0, 100],
    dateFrom: null,
    dateTo: null,
  },
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  },
  realtimeConnected: false,
};

// Action types
const Actions = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_LEADS: 'SET_LEADS',
  SET_PIPELINE_LEADS: 'SET_PIPELINE_LEADS',
  SET_STAGES: 'SET_STAGES',
  SET_SELECTED_LEAD: 'SET_SELECTED_LEAD',
  SET_CONVERSATIONS: 'SET_CONVERSATIONS',
  SET_METRICS: 'SET_METRICS',
  UPDATE_LEAD: 'UPDATE_LEAD',
  ADD_LEAD: 'ADD_LEAD',
  REMOVE_LEAD: 'REMOVE_LEAD',
  SET_FILTERS: 'SET_FILTERS',
  SET_PAGINATION: 'SET_PAGINATION',
  SET_REALTIME_STATUS: 'SET_REALTIME_STATUS',
};

// Reducer
function salesReducer(state, action) {
  switch (action.type) {
    case Actions.SET_LOADING:
      return { ...state, loading: action.payload };
    case Actions.SET_ERROR:
      return { ...state, error: action.payload };
    case Actions.SET_LEADS:
      return { ...state, leads: action.payload, loading: false };
    case Actions.SET_PIPELINE_LEADS:
      return { ...state, pipelineLeads: action.payload };
    case Actions.SET_STAGES:
      return { ...state, stages: action.payload };
    case Actions.SET_SELECTED_LEAD:
      return { ...state, selectedLead: action.payload };
    case Actions.SET_CONVERSATIONS:
      return { ...state, conversations: action.payload };
    case Actions.SET_METRICS:
      return { ...state, metrics: action.payload };
    case Actions.UPDATE_LEAD:
      return {
        ...state,
        leads: state.leads.map(l => l.id === action.payload.id ? action.payload : l),
        pipelineLeads: Object.fromEntries(
          Object.entries(state.pipelineLeads).map(([stage, leads]) =>
            [stage, leads.map(l => l.id === action.payload.id ? action.payload : l)]
          )
        ),
      };
    case Actions.ADD_LEAD:
      return { ...state, leads: [action.payload, ...state.leads] };
    case Actions.REMOVE_LEAD:
      return {
        ...state,
        leads: state.leads.filter(l => l.id !== action.payload),
      };
    case Actions.SET_FILTERS:
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case Actions.SET_PAGINATION:
      return { ...state, pagination: { ...state.pagination, ...action.payload } };
    case Actions.SET_REALTIME_STATUS:
      return { ...state, realtimeConnected: action.payload };
    default:
      return state;
  }
}

// Context
const SalesContext = createContext(null);

// Provider
export function SalesProvider({ children }) {
  const [state, dispatch] = useReducer(salesReducer, initialState);

  // Fetch stages on mount
  useEffect(() => {
    const fetchStages = async () => {
      try {
        const response = await pipelineApi.list();
        dispatch({ type: Actions.SET_STAGES, payload: response.data.stages });
      } catch (error) {
        dispatch({ type: Actions.SET_ERROR, payload: error.message });
      }
    };
    fetchStages();
  }, []);

  // Use real-time hook for live updates
  const { isConnected, subscribe } = useRealtime({
    onLeadUpdate: (lead) => {
      console.log('[SalesContext] Real-time lead update:', lead?.id);
      dispatch({ type: Actions.UPDATE_LEAD, payload: lead });
    },
    onLeadCreate: (lead) => {
      console.log('[SalesContext] Real-time lead created:', lead?.id);
      dispatch({ type: Actions.ADD_LEAD, payload: lead });
    },
    onStageChange: (data) => {
      console.log('[SalesContext] Real-time stage change:', data);
      if (data.lead) {
        dispatch({ type: Actions.UPDATE_LEAD, payload: data.lead });
      }
    },
    onMetricsUpdate: (metrics) => {
      console.log('[SalesContext] Real-time metrics update');
      dispatch({ type: Actions.SET_METRICS, payload: metrics });
    },
    onConnect: () => {
      console.log('[SalesContext] Real-time connected');
    },
    onDisconnect: () => {
      console.log('[SalesContext] Real-time disconnected');
    },
    onError: (error) => {
      console.error('[SalesContext] Real-time error:', error);
    },
  });

  // Update connection status
  useEffect(() => {
    dispatch({ type: Actions.SET_REALTIME_STATUS, payload: isConnected });
  }, [isConnected]);

  // Actions
  const actions = {
    fetchLeads: useCallback(async (filters = {}) => {
      dispatch({ type: Actions.SET_LOADING, payload: true });
      try {
        const response = await leadsApi.list({ ...state.filters, ...filters, ...state.pagination });
        dispatch({ type: Actions.SET_LEADS, payload: response.data.leads });
        dispatch({ type: Actions.SET_PAGINATION, payload: response.data.pagination });
      } catch (error) {
        dispatch({ type: Actions.SET_ERROR, payload: error.message });
      }
    }, [state.filters, state.pagination]),

    fetchPipelineLeads: useCallback(async () => {
      try {
        const response = await leadsApi.getPipeline();
        dispatch({ type: Actions.SET_PIPELINE_LEADS, payload: response.data });
      } catch (error) {
        dispatch({ type: Actions.SET_ERROR, payload: error.message });
      }
    }, []),

    selectLead: useCallback(async (leadId) => {
      if (!leadId) {
        dispatch({ type: Actions.SET_SELECTED_LEAD, payload: null });
        dispatch({ type: Actions.SET_CONVERSATIONS, payload: [] });
        return;
      }
      try {
        const [leadResponse, conversationsResponse] = await Promise.all([
          leadsApi.getById(leadId),
          leadsApi.getConversations(leadId),
        ]);
        dispatch({ type: Actions.SET_SELECTED_LEAD, payload: leadResponse.data.lead });
        dispatch({ type: Actions.SET_CONVERSATIONS, payload: conversationsResponse.data.conversations });
      } catch (error) {
        dispatch({ type: Actions.SET_ERROR, payload: error.message });
      }
    }, []),

    updateLeadStage: useCallback(async (leadId, stageId) => {
      try {
        await leadsApi.updateStage(leadId, stageId);
        await actions.fetchPipelineLeads();
      } catch (error) {
        dispatch({ type: Actions.SET_ERROR, payload: error.message });
        throw error;
      }
    }, [actions.fetchPipelineLeads]),

    assignLead: useCallback(async (leadId, userId) => {
      try {
        await leadsApi.assign(leadId, userId);
        await actions.fetchPipelineLeads();
      } catch (error) {
        dispatch({ type: Actions.SET_ERROR, payload: error.message });
        throw error;
      }
    }, [actions.fetchPipelineLeads]),

    fetchMetrics: useCallback(async (params = {}) => {
      try {
        const response = await metricsApi.getDashboard(params);
        dispatch({ type: Actions.SET_METRICS, payload: response.data });
      } catch (error) {
        dispatch({ type: Actions.SET_ERROR, payload: error.message });
      }
    }, []),

    setFilters: useCallback((filters) => {
      dispatch({ type: Actions.SET_FILTERS, payload: filters });
    }, []),

    setPage: useCallback((page) => {
      dispatch({ type: Actions.SET_PAGINATION, payload: { page } });
    }, []),
  };

  return (
    <SalesContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </SalesContext.Provider>
  );
}

// Hook
export function useSales() {
  const context = useContext(SalesContext);
  if (!context) {
    throw new Error('useSales must be used within a SalesProvider');
  }
  return context;
}

export default SalesContext;
