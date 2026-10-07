export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  done: boolean;
  priority: Priority;
  dueDate?: string;
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface Reminder {
  id: string;
  message: string;
  time: string;
  fired: boolean;
  createdAt: string;
}

export interface JarvisState {
  tasks: Task[];
  notes: Note[];
  reminders: Reminder[];
}

export interface ToolCallRecord {
  name: string;
  args: Record<string, unknown>;
  result: unknown;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  toolCalls?: ToolCallRecord[];
  error?: boolean;
  pending?: boolean;
}
