export interface Agent {
  id: string;
  role: string;
  name: string;
  avatar: string;
  status: 'working' | 'sleeping';
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  assignedTo: string; // Agent ID
  status: 'todo' | 'inprogress' | 'awaiting' | 'done';
  thought: string;
  output: string;
}

export interface CompanyState {
  companyName: string;
  mission: string;
  goal: string;
  apiKey: string;
  budgetUsed: number;
  governanceMode: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  lastMessage: string;
  updatedAt?: string;
}

export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
  senderName?: string;
}

export interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  status: 'draft' | 'sent' | 'cancelled';
  timestamp: string;
}

export interface FileRegistryItem {
  id: string;
  name: string;
  path: string;
  createdBy: string;
  timestamp: string;
  content?: string;
  projectId?: string; // Associated Project ID
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  status: 'active' | 'completed';
}

export interface ActivityItem {
  id: string;
  type: 'ceo' | 'system' | 'agent' | 'error';
  message: string;
  timestamp: string;
  agentId?: string;
}
