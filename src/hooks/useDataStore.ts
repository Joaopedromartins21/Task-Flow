import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Task, Note } from '../types';

interface DataState {
  tasks: Task[];
  notes: Note[];
  userName: string;
  isLoading: boolean;
  setTasks: (tasks: Task[]) => void;
  setNotes: (notes: Note[]) => void;
  setUserName: (name: string) => void;
  setLoading: (loading: boolean) => void;
  fetchData: () => Promise<void>;
}

export const useDataStore = create<DataState>((set, get) => ({
  tasks: [],
  notes: [],
  userName: '',
  isLoading: true,
  setTasks: (tasks) => set({ tasks }),
  setNotes: (notes) => set({ notes }),
  setUserName: (userName) => set({ userName }),
  setLoading: (isLoading) => set({ isLoading }),
  fetchData: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Set user name from metadata
      const userName = user.user_metadata.name || 'Usuário';
      get().setUserName(userName);

      // Fetch tasks and notes in parallel
      const [tasksResponse, notesResponse] = await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .order('due_date', { ascending: true }),
        supabase
          .from('notes')
          .select('*')
          .eq('user_id', user.id)
          .order('pinned', { ascending: false })
          .order('created_at', { ascending: false })
      ]);

      if (tasksResponse.error) throw tasksResponse.error;
      if (notesResponse.error) throw notesResponse.error;

      get().setTasks(tasksResponse.data || []);
      get().setNotes(notesResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      get().setLoading(false);
    }
  }
}));

// Subscribe to real-time changes
supabase
  .channel('db_changes')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public',
    table: 'tasks'
  }, () => {
    useDataStore.getState().fetchData();
  })
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'notes'
  }, () => {
    useDataStore.getState().fetchData();
  })
  .subscribe();