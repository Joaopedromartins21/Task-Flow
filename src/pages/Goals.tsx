import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Check, X, Clock, Calendar, ChevronLeft, ChevronRight, Repeat, MapPin, Paperclip, AlertCircle, Edit2, ChevronDown, ChevronRight as ChevronRightIcon, List } from 'lucide-react';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  parseISO,
  startOfDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { getRandomMessage } from '../utils/motivationalMessages';
import { XPAnimation } from '../components/XPAnimation';

interface Attachment {
  name: string;
  url: string;
  type: string;
}

type Priority = 'baixa' | 'media' | 'alta' | 'urgente';

interface Task {
  id: string;
  user_id: string;
  parent_id?: string | null;
  title: string;
  description?: string;
  due_date: string;
  due_time?: string | null;
  completed: boolean;
  recurrence?: 'daily' | 'weekly' | 'monthly' | null;
  recurrence_end_date?: string | null;
  location?: string;
  attachments?: Attachment[];
  priority: Priority;
  subtasks?: Task[];
}

const priorityColors: Record<Priority, { bg: string; text: string; border: string }> = {
  baixa: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-700' },
  media: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-700' },
  alta: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-700' },
  urgente: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-700' },
};

export function Goals() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(format(startOfDay(new Date()), 'yyyy-MM-dd'));
  const [dueTime, setDueTime] = useState('');
  const [recurrence, setRecurrence] = useState<'daily' | 'weekly' | 'monthly' | null>(null);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [priority, setPriority] = useState<Priority>('media');
  const [error, setError] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showMonthCalendar, setShowMonthCalendar] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [parentTask, setParentTask] = useState<Task | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [xpAnimations, setXpAnimations] = useState<Array<{ id: number; position: { x: number; y: number } }>>([]);

  useEffect(() => {
    loadTasks();
    setSelectedDate(startOfDay(new Date()));
  }, []);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const monthCalendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const monthCalendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const allMonthDays = eachDayOfInterval({ start: monthCalendarStart, end: monthCalendarEnd });
  
  const weeks = [];
  let week = [];
  allMonthDays.forEach((day) => {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  });

  async function loadTasks() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });

      if (error) throw error;

      const taskMap = new Map<string, Task>();
      const rootTasks: Task[] = [];

      data?.forEach(task => {
        taskMap.set(task.id, { ...task, subtasks: [] });
      });

      data?.forEach(task => {
        const taskWithSubtasks = taskMap.get(task.id)!;
        if (task.parent_id) {
          const parent = taskMap.get(task.parent_id);
          if (parent) {
            parent.subtasks = parent.subtasks || [];
            parent.subtasks.push(taskWithSubtasks);
          }
        } else {
          rootTasks.push(taskWithSubtasks);
        }
      });

      setTasks(rootTasks);
    } catch (err) {
      console.error('Erro ao carregar tarefas:', err);
      setError('Não foi possível carregar as tarefas');
    } finally {
      setLoading(false);
    }
  }

  async function uploadAttachment(file: File): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('attachments')
      .upload(filePath, file, {
        upsert: true,
        onUploadProgress: (progress) => {
          setUploadProgress((progress.loaded / progress.total) * 100);
        },
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('attachments')
      .getPublicUrl(filePath);

    return publicUrl;
  }

  async function handleToggleTask(taskId: string, completed: boolean, event: React.MouseEvent) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error: taskError } = await supabase
        .from('tasks')
        .update({ completed })
        .eq('id', taskId);

      if (taskError) throw taskError;

      if (completed) {
        const { error: expError } = await supabase
          .rpc('add_experience', { user_uuid: user.id, exp_points: 10 });

        if (expError) throw expError;

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

      loadTasks();
    } catch (err) {
      console.error('Erro ao atualizar tarefa:', err);
      toast.error('Não foi possível atualizar a tarefa');
    }
  }

  function handleEdit(task: Task) {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setDueDate(task.due_date);
    setDueTime(task.due_time || '');
    setRecurrence(task.recurrence || null);
    setRecurrenceEndDate(task.recurrence_end_date || '');
    setLocation(task.location || '');
    setPriority(task.priority);
    setShowModal(true);
  }

  function handleAddSubtask(parentTask: Task) {
    setParentTask(parentTask);
    setTitle('');
    setDescription('');
    setDueDate(parentTask.due_date);
    setDueTime('');
    setPriority(parentTask.priority);
    setShowModal(true);
  }

  function handleCloseModal() {
    setShowModal(false);
    setEditingTask(null);
    setParentTask(null);
    setTitle('');
    setDescription('');
    setDueDate(format(startOfDay(selectedDate), 'yyyy-MM-dd'));
    setDueTime('');
    setRecurrence(null);
    setRecurrenceEndDate('');
    setLocation('');
    setAttachments([]);
    setPriority('media');
    setUploadProgress(0);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setUploadProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const uploadedAttachments: Attachment[] = [];
      for (const file of attachments) {
        const url = await uploadAttachment(file);
        uploadedAttachments.push({
          name: file.name,
          url,
          type: file.type,
        });
      }

      const taskData = {
        title,
        description,
        due_date: dueDate,
        due_time: dueTime || null,
        recurrence,
        recurrence_end_date: recurrenceEndDate || null,
        location,
        priority,
        parent_id: parentTask?.id || null,
        ...(uploadedAttachments.length > 0 && { attachments: uploadedAttachments }),
      };

      if (editingTask) {
        const { error } = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', editingTask.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tasks')
          .insert([{ ...taskData, user_id: user.id }]);

        if (error) throw error;
      }

      handleCloseModal();
      loadTasks();
    } catch (err) {
      console.error('Erro ao salvar tarefa:', err);
      setError(`Não foi possível ${editingTask ? 'atualizar' : 'adicionar'} a tarefa`);
    }
  }

  async function handleDeleteTask(taskId: string) {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (task?.attachments?.length) {
        for (const attachment of task.attachments) {
          const path = new URL(attachment.url).pathname.split('/').pop();
          if (path) {
            await supabase.storage
              .from('attachments')
              .remove([path]);
          }
        }
      }

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      loadTasks();
    } catch (err) {
      console.error('Erro ao deletar tarefa:', err);
      setError('Não foi possível deletar a tarefa');
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  const toggleExpanded = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const renderTask = (task: Task, level = 0) => {
    const isExpanded = expandedTasks.has(task.id);
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;

    return (
      <div key={task.id} className={`${level > 0 ? 'ml-6 mt-2' : ''}`}>
        <div
          className={`p-4 border rounded-lg ${
            task.completed
              ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
              : `${priorityColors[task.priority].bg} ${priorityColors[task.priority].border}`
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
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
              <div>
                <div className="flex items-center gap-2">
                  {hasSubtasks && (
                    <button
                      onClick={() => toggleExpanded(task.id)}
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {isExpanded ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRightIcon size={16} />
                      )}
                    </button>
                  )}
                  <h3
                    className={`font-medium ${
                      task.completed ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {task.title}
                  </h3>
                  {task.recurrence && (
                    <Repeat size={16} className="text-blue-500 dark:text-blue-400" />
                  )}
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
                  {task.recurrence && (
                    <span className="flex items-center">
                      <Repeat size={14} className="mr-1" />
                      {task.recurrence === 'daily' && 'Diariamente'}
                      {task.recurrence === 'weekly' && 'Semanalmente'}
                      {task.recurrence === 'monthly' && 'Mensalmente'}
                    </span>
                  )}
                </div>
                {task.attachments && task.attachments.length > 0 && (
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-2">
                      {task.attachments.map((attachment, index) => (
                        <a
                          key={index}
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        >
                          <Paperclip size={14} />
                          {attachment.name}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleAddSubtask(task)}
                className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                title="Adicionar subtarefa"
              >
                <List size={20} />
              </button>
              <button
                onClick={() => handleEdit(task)}
                className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                title="Editar tarefa"
              >
                <Edit2 size={20} />
              </button>
              <button
                onClick={() => handleDeleteTask(task.id)}
                className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-500"
                title="Excluir tarefa"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        </div>
        {isExpanded && hasSubtasks && (
          <div className="mt-2">
            {task.subtasks?.map(subtask => renderTask(subtask, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      // Use parseISO instead of new Date to ensure consistent timezone handling
      const taskDate = parseISO(task.due_date);
      
      if (!task.recurrence) {
        return isSameDay(taskDate, date);
      }

      const startDate = parseISO(task.due_date);
      const endDate = task.recurrence_end_date ? parseISO(task.recurrence_end_date) : undefined;

      if (endDate && date > endDate) {
        return false;
      }

      switch (task.recurrence) {
        case 'daily':
          const dayOfWeek = date.getDay();
          return dayOfWeek >= 1 && dayOfWeek <= 5 && date >= startDate;
        case 'weekly':
          return date.getDay() === startDate.getDay() && date >= startDate;
        case 'monthly':
          return date.getDate() === startDate.getDate() && date >= startDate;
        default:
          return false;
      }
    });
  };

  const nextPeriod = () => {
    if (showMonthCalendar) {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const prevPeriod = () => {
    if (showMonthCalendar) {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const onDateClick = (day: Date) => {
    const startOfSelectedDay = startOfDay(day);
    setSelectedDate(startOfSelectedDay);
    setDueDate(format(startOfSelectedDay, 'yyyy-MM-dd'));
  };

  const selectedDateTasks = getTasksForDate(selectedDate);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Objetivos</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowMonthCalendar(!showMonthCalendar)}
              className="flex items-center justify-center p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <Calendar size={20} />
            </button>
            <button
              onClick={() => {
                setDueDate(format(startOfDay(selectedDate), 'yyyy-MM-dd'));
                setShowModal(true);
              }}
              className="flex items-center justify-center p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-200 rounded-md">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevPeriod}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {format(currentDate, showMonthCalendar ? 'MMMM yyyy' : "'Semana de' d 'de' MMMM", { locale: ptBR })}
            </h2>
            <button
              onClick={nextPeriod}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 p-2"
              >
                {day}
              </div>
            ))}

            {showMonthCalendar ? (
              weeks.map((week, weekIndex) => (
                <React.Fragment key={weekIndex}>
                  {week.map((day, dayIndex) => {
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isSelected = isSameDay(day, selectedDate);
                    const todayClass = isToday(day) ? 'border-blue-500 dark:border-blue-400' : '';
                    const monthClass = isCurrentMonth ? 'text-gray-900 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500';
                    const selectedClass = isSelected ? 'bg-blue-100 dark:bg-blue-900/30' : '';

                    return (
                      <button
                        key={dayIndex}
                        onClick={() => onDateClick(day)}
                        className={`h-12 p-2 border dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 ${todayClass} ${monthClass} ${selectedClass} relative`}
                      >
                        <span>{format(day, 'd')}</span>
                        {getTasksForDate(day).length > 0 && (
                          <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 dark:bg-blue-400 rounded-full"></span>
                        )}
                      </button>
                    );
                  })}
                </React.Fragment>
              ))
            ) : (
              weekDays.map((day, index) => {
                const isSelected = isSameDay(day, selectedDate);
                const todayClass = isToday(day) ? 'border-blue-500 dark:border-blue-400' : '';
                const selectedClass = isSelected ? 'bg-blue-100 dark:bg-blue-900/30' : '';

                return (
                  <button
                    key={index}
                    onClick={() => onDateClick(day)}
                    className={`h-12 p-2 border dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 ${todayClass} ${selectedClass} relative text-gray-900 dark:text-gray-300`}
                  >
                    <span>{format(day, 'd')}</span>
                    {getTasksForDate(day).length > 0 && (
                      <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 dark:bg-blue-400 rounded-full"></span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Tarefas para {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
            </h2>
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
              </div>
            ) : selectedDateTasks.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                Sem tarefas para este dia
              </p>
            ) : (
              <div className="space-y-4">
                {selectedDateTasks.map((task) => renderTask(task))}
              </div>
            )}
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingTask ? 'Editar Tarefa' : parentTask ? `Nova Subtarefa de "${parentTask.title}"` : 'Nova Tarefa'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Título
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Digite o título da tarefa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descrição (opcional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Digite uma descrição"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <Calendar size={16} className="inline mr-1" />
                      Data
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <Clock size={16} className="inline mr-1" />
                      Horário (opcional)
                    </label>
                    <input
                      type="time"
                      value={dueTime}
                      onChange={(e) => setDueTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <MapPin size={16} className="inline mr-1" />
                    Localização (opcional)
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Digite a localização"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <AlertCircle size={16} className="inline mr-1" />
                    Prioridade
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>

                {!parentTask && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <Repeat size={16} className="inline mr-1" />
                      Recorrência
                    </label>
                    <select
                      value={recurrence || ''}
                      onChange={(e) => setRecurrence(e.target.value as Task['recurrence'])}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Sem recorrência</option>
                      <option value="daily">Diariamente (Seg-Sex)</option>
                      <option value="weekly">Semanalmente</option>
                      <option value="monthly">Mensalmente</option>
                    </select>
                  </div>
                )}

                {recurrence && !parentTask && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <Calendar size={16} className="inline mr-1" />
                      Data Final da Recorrência (opcional)
                    </label>
                    <input
                      type="date"
                      value={recurrenceEndDate}
                      onChange={(e) => setRecurrenceEndDate(e.target.value)}
                      min={dueDate}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Paperclip size={16} className="inline mr-1" />
                    Anexos (opcional)
                  </label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    multiple
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    accept="image/*,.pdf"
                  />
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="mt-2">
                      <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
                        <div
                          className="h-2 bg-blue-600 rounded-full"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {editingTask ? (
                    <>
                      <Edit2 size={20} className="mr-2" />
                      Salvar Alterações
                    </>
                  ) : parentTask ? (
                    <>
                      <List size={20} className="mr-2" />
                      Adicionar Subtarefa
                    </>
                  ) : (
                    <>
                      <Plus size={20} className="mr-2" />
                      Adicionar Tarefa
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

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
      </div>
    </Layout>
  );
}