import api from './api';

// Leads API
export const leadsApi = {
  list: (params) => api.get('/api/sales/leads', { params }),
  getPipeline: () => api.get('/api/sales/leads/pipeline'),
  getById: (id) => api.get(`/api/sales/leads/${id}`),
  create: (data) => api.post('/api/sales/leads', data),
  update: (id, data) => api.put(`/api/sales/leads/${id}`, data),
  delete: (id) => api.delete(`/api/sales/leads/${id}`),
  updateStage: (id, stageId) => api.patch(`/api/sales/leads/${id}/stage`, { stageId }),
  assign: (id, userId) => api.patch(`/api/sales/leads/${id}/assign`, { userId }),
  recalculateScore: (id) => api.post(`/api/sales/leads/${id}/score`),
  qualify: (id) => api.post(`/api/sales/leads/${id}/qualify`),
  getConversations: (id) => api.get(`/api/sales/leads/${id}/conversations`),
  addNote: (id, note) => api.post(`/api/sales/leads/${id}/notes`, { note }),
  bulkUpdateStage: (leadIds, stageId) => api.patch('/api/sales/leads/bulk/stage', { leadIds, stageId }),
  bulkAssign: (leadIds, userId) => api.patch('/api/sales/leads/bulk/assign', { leadIds, userId }),
};

// Pipeline API
export const pipelineApi = {
  list: () => api.get('/api/sales/pipeline'),
  getStageTypes: () => api.get('/api/sales/pipeline/stages/types'),
  createStage: (data) => api.post('/api/sales/pipeline/stages', data),
  updateStage: (id, data) => api.put(`/api/sales/pipeline/stages/${id}`, data),
  deleteStage: (id) => api.delete(`/api/sales/pipeline/stages/${id}`),
  reorderStages: (stageIds) => api.patch('/api/sales/pipeline/stages/reorder', { stageIds }),
  getStats: () => api.get('/api/sales/pipeline/stats'),
};

// Metrics API
export const metricsApi = {
  getDashboard: (params) => api.get('/api/sales/metrics/dashboard', { params }),
  getPipeline: () => api.get('/api/sales/metrics/pipeline'),
  getTrends: (params) => api.get('/api/sales/metrics/trends', { params }),
  getPerformance: (params) => api.get('/api/sales/metrics/performance', { params }),
  getConversion: (params) => api.get('/api/sales/metrics/conversion', { params }),
  getDaily: (params) => api.get('/api/sales/metrics/daily', { params }),
  record: (data) => api.post('/api/sales/metrics/record', data),
};

// Export all
export default { leads: leadsApi, pipeline: pipelineApi, metrics: metricsApi };
