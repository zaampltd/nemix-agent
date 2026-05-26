import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import path from 'path';
import { 
  Agent, 
  Ticket, 
  CompanyState, 
  ChatSession, 
  ChatMessage, 
  Email, 
  FileRegistryItem, 
  ActivityItem 
} from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const CHATS_DIR = path.join(DATA_DIR, 'chats');
const EMAILS_DIR = path.join(DATA_DIR, 'emails');
const FILES_DIR = path.join(DATA_DIR, 'files');

const COMPANY_PATH = path.join(DATA_DIR, 'company.json');
const AGENTS_PATH = path.join(DATA_DIR, 'agents.json');
const TICKETS_PATH = path.join(DATA_DIR, 'tickets.json');
const CHAT_INDEX_PATH = path.join(CHATS_DIR, 'index.json');
const EMAIL_INDEX_PATH = path.join(EMAILS_DIR, 'index.json');
const FILE_INDEX_PATH = path.join(FILES_DIR, 'index.json');
const ACTIVITY_PATH = path.join(DATA_DIR, 'activity.json');

// Ensure database directories and files exist
export function initDB() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!existsSync(CHATS_DIR)) {
    mkdirSync(CHATS_DIR, { recursive: true });
  }
  if (!existsSync(EMAILS_DIR)) {
    mkdirSync(EMAILS_DIR, { recursive: true });
  }
  if (!existsSync(FILES_DIR)) {
    mkdirSync(FILES_DIR, { recursive: true });
  }

  // Pre-initialize empty or default files
  const defaultCompany: CompanyState = {
    companyName: '',
    mission: '',
    goal: '',
    apiKey: '',
    budgetUsed: 0,
    governanceMode: true
  };

  if (!existsSync(COMPANY_PATH)) {
    writeFileSync(COMPANY_PATH, JSON.stringify(defaultCompany, null, 2), 'utf-8');
  }
  if (!existsSync(AGENTS_PATH)) {
    writeFileSync(AGENTS_PATH, JSON.stringify([], null, 2), 'utf-8');
  }
  if (!existsSync(TICKETS_PATH)) {
    writeFileSync(TICKETS_PATH, JSON.stringify([], null, 2), 'utf-8');
  }
  if (!existsSync(CHAT_INDEX_PATH)) {
    writeFileSync(CHAT_INDEX_PATH, JSON.stringify([], null, 2), 'utf-8');
  }
  if (!existsSync(EMAIL_INDEX_PATH)) {
    writeFileSync(EMAIL_INDEX_PATH, JSON.stringify([], null, 2), 'utf-8');
  }
  if (!existsSync(FILE_INDEX_PATH)) {
    writeFileSync(FILE_INDEX_PATH, JSON.stringify([], null, 2), 'utf-8');
  }
  if (!existsSync(ACTIVITY_PATH)) {
    writeFileSync(ACTIVITY_PATH, JSON.stringify([], null, 2), 'utf-8');
  }
}

// Utility read/write with types
function safeReadJSON<T>(filePath: string, fallback: T): T {
  initDB();
  if (!existsSync(filePath)) return fallback;
  try {
    const data = readFileSync(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch (e) {
    console.error(`Error reading database file at ${filePath}:`, e);
    return fallback;
  }
}

function safeWriteJSON<T>(filePath: string, data: T) {
  initDB();
  try {
    const tempPath = `${filePath}.tmp`;
    writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    if (existsSync(tempPath)) {
      unlinkSync(tempPath);
    }
  } catch (e) {
    console.error(`Error writing database file at ${filePath}:`, e);
  }
}

// ─── Company API ───
export function getCompany(): CompanyState {
  return safeReadJSON<CompanyState>(COMPANY_PATH, {
    companyName: '',
    mission: '',
    goal: '',
    apiKey: '',
    budgetUsed: 0,
    governanceMode: true
  });
}

export function saveCompany(company: CompanyState) {
  safeWriteJSON<CompanyState>(COMPANY_PATH, company);
}

// ─── Agents API ───
export function getAgents(): Agent[] {
  return safeReadJSON<Agent[]>(AGENTS_PATH, []);
}

export function saveAgents(agents: Agent[]) {
  safeWriteJSON<Agent[]>(AGENTS_PATH, agents);
}

// ─── Tickets API ───
export function getTickets(): Ticket[] {
  return safeReadJSON<Ticket[]>(TICKETS_PATH, []);
}

export function saveTickets(tickets: Ticket[]) {
  safeWriteJSON<Ticket[]>(TICKETS_PATH, tickets);
}

// ─── Chat Sessions API ───
export function getChatSessions(): ChatSession[] {
  return safeReadJSON<ChatSession[]>(CHAT_INDEX_PATH, []);
}

export function saveChatSessions(sessions: ChatSession[]) {
  safeWriteJSON<ChatSession[]>(CHAT_INDEX_PATH, sessions);
}

export function createChatSession(title: string): ChatSession {
  const sessions = getChatSessions();
  const newSession: ChatSession = {
    id: `chat_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`,
    title,
    createdAt: new Date().toISOString(),
    lastMessage: 'Session started.'
  };
  sessions.unshift(newSession);
  saveChatSessions(sessions);

  // Initialize the message file for this session
  const sessionFilePath = path.join(CHATS_DIR, `${newSession.id}.json`);
  safeWriteJSON<ChatMessage[]>(sessionFilePath, []);

  return newSession;
}

export function deleteChatSession(sessionId: string) {
  const sessions = getChatSessions();
  const filtered = sessions.filter(s => s.id !== sessionId);
  saveChatSessions(filtered);

  const sessionFilePath = path.join(CHATS_DIR, `${sessionId}.json`);
  if (existsSync(sessionFilePath)) {
    try {
      unlinkSync(sessionFilePath);
    } catch {}
  }
}

export function getChatMessages(sessionId: string): ChatMessage[] {
  const sessionFilePath = path.join(CHATS_DIR, `${sessionId}.json`);
  return safeReadJSON<ChatMessage[]>(sessionFilePath, []);
}

export function saveChatMessage(sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) {
  const sessionFilePath = path.join(CHATS_DIR, `${sessionId}.json`);
  const messages = getChatMessages(sessionId);
  
  const newMessage: ChatMessage = {
    ...message,
    id: `msg_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`,
    timestamp: new Date().toISOString()
  };
  
  messages.push(newMessage);
  safeWriteJSON<ChatMessage[]>(sessionFilePath, messages);

  // Update lastMessage and updatedAt in index
  const sessions = getChatSessions();
  const idx = sessions.findIndex(s => s.id === sessionId);
  if (idx !== -1) {
    sessions[idx].lastMessage = message.content.substring(0, 60) + (message.content.length > 60 ? '...' : '');
    sessions[idx].updatedAt = new Date().toISOString();
    // Move to front
    const [sess] = sessions.splice(idx, 1);
    sessions.unshift(sess);
    saveChatSessions(sessions);
  }
  
  return newMessage;
}

// ─── Emails API ───
export function getEmails(): Email[] {
  return safeReadJSON<Email[]>(EMAIL_INDEX_PATH, []);
}

export function saveEmail(email: Omit<Email, 'id' | 'timestamp'> & { id?: string }): Email {
  const emails = getEmails();
  const newEmail: Email = {
    ...email,
    id: email.id || `email_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`,
    timestamp: new Date().toISOString()
  };

  const existingIdx = emails.findIndex(e => e.id === newEmail.id);
  if (existingIdx !== -1) {
    emails[existingIdx] = newEmail;
  } else {
    emails.unshift(newEmail);
  }

  safeWriteJSON<Email[]>(EMAIL_INDEX_PATH, emails);
  return newEmail;
}

export function updateEmailStatus(id: string, status: 'draft' | 'sent' | 'cancelled'): Email | null {
  const emails = getEmails();
  const idx = emails.findIndex(e => e.id === id);
  if (idx === -1) return null;
  emails[idx].status = status;
  safeWriteJSON<Email[]>(EMAIL_INDEX_PATH, emails);
  return emails[idx];
}

// ─── Files API ───
export function getFiles(): FileRegistryItem[] {
  return safeReadJSON<FileRegistryItem[]>(FILE_INDEX_PATH, []);
}

export function saveFile(
  name: string, 
  content: string, 
  createdBy: string
): FileRegistryItem {
  const company = getCompany();
  const cleanCompName = (company.companyName || 'DefaultCompany').replace(/[^a-zA-Z0-9_-]/g, '_');
  
  // Real local directory path
  const localProjectDir = `C:\\Users\\shahi\\NvmixProjects\\${cleanCompName}`;
  if (!existsSync(localProjectDir)) {
    mkdirSync(localProjectDir, { recursive: true });
  }

  const localFilePath = path.join(localProjectDir, name);
  writeFileSync(localFilePath, content, 'utf-8');

  // Register in metadata registry
  const files = getFiles();
  const newFileItem: FileRegistryItem = {
    id: `file_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`,
    name,
    path: localFilePath,
    createdBy,
    timestamp: new Date().toISOString()
  };

  // Add or update
  const existingIdx = files.findIndex(f => f.name === name);
  if (existingIdx !== -1) {
    files[existingIdx] = newFileItem;
  } else {
    files.unshift(newFileItem);
  }

  safeWriteJSON<FileRegistryItem[]>(FILE_INDEX_PATH, files);
  return newFileItem;
}

// ─── Activity API ───
export function getActivity(): ActivityItem[] {
  return safeReadJSON<ActivityItem[]>(ACTIVITY_PATH, []);
}

export function addActivity(
  type: 'ceo' | 'system' | 'agent' | 'error',
  message: string,
  agentId?: string
): ActivityItem {
  const activity = getActivity();
  const newActivity: ActivityItem = {
    id: `act_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`,
    type,
    message,
    timestamp: new Date().toISOString(),
    agentId
  };
  activity.unshift(newActivity);
  // Cap at 100 entries to prevent infinite growth
  if (activity.length > 100) {
    activity.pop();
  }
  safeWriteJSON<ActivityItem[]>(ACTIVITY_PATH, activity);
  return newActivity;
}
