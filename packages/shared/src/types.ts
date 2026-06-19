export type Role = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
}

export interface ContextPayload {
  boardName: string;
  visibleLists: string[];
  selectedCard: string | null;
  currentUrl: string;
  pageTitle: string;
}

export interface ExecutionPlan {
  steps: string[];
  status: 'pending' | 'running' | 'success' | 'failed';
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  method: string;
  parameters: any;
}

export interface ToolResponse {
  success: boolean;
  message: string;
  data?: any;
}
