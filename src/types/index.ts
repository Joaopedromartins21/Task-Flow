export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  parent_id?: string | null;
  title: string;
  description?: string;
  due_date: string;
  completed: boolean;
  created_at: string;
  due_time: string;
  location?: string;
  priority: 'baixa' | 'media' | 'alta' | 'urgente';
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  subtasks?: Task[];
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content?: string;
  color: string;
  due_date?: string;
  created_at: string;
  pinned: boolean;
  completed: boolean;
}

export interface Profile {
  id: string;
  user_id: string;
  level: number;
  experience: number;
  theme_color: string;
  dark_mode: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}