// Lead types
export interface Lead {
  id: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  leadScore: number;
  scoreBreakdown: ScoreBreakdown;
  pipelineStageId: string;
  pipelineStageName: string;
  pipelineStageColor: string;
  qualificationStatus: 'new' | 'qualified' | 'disqualified' | 'converted';
  intentLevel: 'high' | 'medium' | 'low' | 'none';
  assignedTo?: string;
  assignedAt?: string;
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScoreBreakdown {
  engagement: number;
  intent: number;
  urgency: number;
  confidence: number;
  sentiment: number;
}

// Pipeline Stage types
export interface PipelineStage {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  colorCode: string;
  stageType: 'new' | 'contacted' | 'scheduled' | 'proposal' | 'negotiation' | 'won' | 'lost';
  displayOrder: number;
  leadsCount: number;
}

// Conversation types
export interface Conversation {
  id: string;
  leadId: string;
  direction: 'inbound' | 'outbound';
  messageType: 'text' | 'image' | 'document' | 'audio' | 'video';
  messageContent: string;
  messageMediaUrl?: string;
  aiAnalysis?: MessageAnalysis;
  isRead: boolean;
  createdAt: string;
}

export interface MessageAnalysis {
  sentiment: number;
  intent: string;
  keywords: string[];
}

// Metrics types
export interface DashboardMetrics {
  totalLeads: number;
  newLeadsToday: number;
  convertedToday: number;
  conversionRate: number;
  avgResponseTime: number;
  totalRevenue: number;
  pipelineValue: number;
  topPerformers: Performer[];
  trends: TrendData[];
}

export interface Performer {
  userId: string;
  userName: string;
  leadsConverted: number;
  revenue: number;
}

export interface TrendData {
  date: string;
  leads: number;
  conversions: number;
  revenue: number;
}

// Filter types
export interface LeadFilters {
  search?: string;
  stage?: string;
  assignedTo?: string;
  scoreRange?: [number, number];
  dateFrom?: string;
  dateTo?: string;
}
