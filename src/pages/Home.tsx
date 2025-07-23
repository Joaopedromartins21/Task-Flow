import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { format, startOfDay, parseISO, isToday, addDays, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, Clock, MapPin, Pin, Calendar, Search, AlertCircle } from 'lucide-react';
import { useThemeColor } from '../hooks/useThemeColor';
import { useDataStore } from '../hooks/useDataStore';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { getRandomMessage } from '../utils/motivationalMessages';
import { XPAnimation } from '../components/XPAnimation';

const priorityColors = {
  baixa: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-700' },
  media: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-700' },
  alta: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-700' },
  urgente: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-700' },
};

const priorityOrder = ['urgente', 'alta', 'media', 'baixa'];

export function Home() {
  const themeColor = useThemeColor();
  const { tasks, notes, userName, isLoading } = useDataStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [xpAnimations, setXpAnimations] = useState<Array<{ id: number; position: { x: number; y: number } }>>([]);

  async function handleToggleTask(taskId: string, completed: boolean, event: React.MouseEvent) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error: taskError } = await supabase
        .from('tasks')
        .update({ completed })
        .eq('id', taskId);

      if (taskError) throw taskError;

      // If task is being completed, add experience points
      if (completed) {
        const { error: expError } = await supabase
          .rpc('add_experience', { user_uuid: user.id, exp_points: 10 });

        if (expError) throw expError;

        // Show XP animation
        const rect = (event.target as HTMLElement).getBoundingClientRect();
        setXpAnimations(prev => [
          ...prev,
          {
            id: Date.now(),
            position: {
              x: rect.left,
              y: rect.top
            }
          }
        ]);

        toast.success(getRandomMessage(), {
          icon: '🎉',
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      toast.error('Não foi possível atualizar a tarefa');
    }
  }

  const filteredTasks = tasks.filter(task => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = task.title.toLowerCase().includes(searchLower) ||
      (task.description?.toLowerCase() || '').includes(searchLower);
    return matchesSearch && (showCompleted || !task.completed);
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
        </div>
      </Layout>
    );
  }

  const today = format(new Date(), "d 'de' MMMM", { locale: ptBR });
  const todayStart = startOfDay(new Date());
  const tomorrowStart = addDays(todayStart, 1);
  const weekStart = addDays(todayStart, 7);

  // Group tasks by date and priority
  const todayTasks = filteredTasks.filter(task => isToday(parseISO(task.due_date)));
  const tomorrowTasks = filteredTasks.filter(task => {
    const taskDate = parseISO(task.due_date);
    return taskDate >= tomorrowStart && taskDate < addDays(tomorrowStart, 1);
  });
  const thisWeekTasks = filteredTasks.filter(task => {
    const taskDate = parseISO(task.due_date);
    return taskDate > tomorrowStart && taskDate <= weekStart;
  });
  const laterTasks = filteredTasks.filter(task => {
    const taskDate = parseISO(task.due_date);
    return taskDate > weekStart;
  });
  const overdueTasks = filteredTasks.filter(task => {
    const taskDate = parseISO(task.due_date);
    return isBefore(taskDate, todayStart) && !task.completed;
  });

  const todayNotes = notes.filter(note => 
    note.due_date && isToday(parseISO(note.due_date))
  );

  // Group tasks by priority
  const groupTasksByPriority = (tasks) => {
    return priorityOrder.reduce((acc, priority) => {
      const tasksForPriority = tasks.filter(task => task.priority === priority);
      if (tasksForPriority.length > 0) {
        acc[priority] = tasksForPriority;
      }
      return acc;
    }, {});
  };

  const renderTask = (task) => (
    <div
      key={task.id}
      className={`p-4 border rounded-lg ${
        task.completed
          ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
          : `${priorityColors[task.priority].bg} ${priorityColors[task.priority].border}`
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={(e) => handleToggleTask(task.id, !task.completed, e)}
          className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full border-2 ${
            task.completed
              ? 'bg-green-500 border-green-500'
              : 'border-gray-300 dark:border-gray-500'
          } flex items-center justify-center`}
        >
          {task.completed && <Check size={12} className="text-white" />}
        </button>

        <div className="flex-grow">
          <div className="flex items-center gap-2">
            <h3
              className={`font-medium ${
                task.completed ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-white'
              }`}
            >
              {task.title}
            </h3>
            <span className={`text-sm px-2 py-0.5 rounded ${priorityColors[task.priority].bg} ${priorityColors[task.priority].text}`}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </span>
          </div>

          {task.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {task.description}
            </p>
          )}

          <div className="flex items-center flex-wrap gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
            {!isToday(parseISO(task.due_date)) && (
              <span className="flex items-center">
                <Calendar size={14} className="mr-1" />
                {format(parseISO(task.due_date), "d 'de' MMMM", { locale: ptBR })}
              </span>
            )}
            {task.due_time && (
              <span className="flex items-center">
                <Clock size={14} className="mr-1" />
                {task.due_time}
              </span>
            )}
            {task.location && (
              <span className="flex items-center">
                <MapPin size={14} className="mr-1" />
                {task.location}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTaskGroup = (tasks, title, icon = null) => {
    if (tasks.length === 0) return null;

    const tasksByPriority = groupTasksByPriority(tasks);

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-6">
          {icon}
          <h2 
            className="text-xl font-semibold text-gray-900 dark:text-white"
            style={{ color: themeColor }}
          >
            {title}
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({tasks.length})
          </span>
        </div>
        
        <div className="space-y-6">
          {priorityOrder.map(priority => {
            if (!tasksByPriority[priority]) return null;
            return (
              <div key={priority}>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </h3>
                <div className="space-y-4">
                  {tasksByPriority[priority].map(renderTask)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
          <h1 
            className="text-3xl font-bold mb-2 text-gray-900 dark:text-white"
            style={{ color: themeColor }}
          >
            Olá, {userName}!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Você tem {todayTasks.length} {todayTasks.length === 1 ? 'tarefa' : 'tarefas'} 
            {todayNotes.length > 0 && ` e ${todayNotes.length} ${todayNotes.length === 1 ? 'nota' : 'notas'}`} 
            para hoje, {today}.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar tarefas..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
              />
              Mostrar concluídas
            </label>
          </div>
        </div>

        <div className="space-y-8">
          {/* Overdue Tasks */}
          {overdueTasks.length > 0 && renderTaskGroup(
            overdueTasks,
            'Tarefas Atrasadas',
            <AlertCircle className="text-red-500 dark:text-red-400\" size={24} />
          )}

          {/* Today's Tasks */}
          {renderTaskGroup(todayTasks, 'Tarefas de Hoje')}

          {/* Tomorrow's Tasks */}
          {renderTaskGroup(tomorrowTasks, 'Tarefas de Amanhã')}

          {/* This Week's Tasks */}
          {renderTaskGroup(thisWeekTasks, 'Tarefas desta Semana')}

          {/* Later Tasks */}
          {renderTaskGroup(laterTasks, 'Tarefas Futuras')}

          {/* Notes Section */}
          {todayNotes.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 
                className="text-xl font-semibold mb-6 text-gray-900 dark:text-white"
                style={{ color: themeColor }}
              >
                Notas de Hoje
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {todayNotes.map((note) => (
                  <div
                    key={note.id}
                    className="relative group"
                    style={{ backgroundColor: note.color }}
                  >
                    <div className="absolute -rotate-2 w-full h-full rounded-lg shadow-md transition-transform group-hover:-rotate-1"></div>
                    <div 
                      className="relative p-4 rounded-lg shadow-lg transform transition-transform group-hover:scale-105"
                      style={{ backgroundColor: note.color }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-800 break-words flex-grow">
                          {note.title}
                        </h3>
                        {note.pinned && (
                          <Pin size={16} className="text-blue-600 fill-current" />
                        )}
                      </div>
                      {note.content && (
                        <p className="text-gray-700 whitespace-pre-wrap break-words mb-2">
                          {note.content}
                        </p>
                      )}
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar size={14} className="mr-1" />
                        Hoje
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {xpAnimations.map(animation => (
        <XPAnimation
          key={animation.id}
          xp={10}
          position={animation.position}
          onComplete={() => {
            setXpAnimations(prev => prev.filter(a => a.id !== animation.id));
          }}
        />
      ))}
    </Layout>
  );
}