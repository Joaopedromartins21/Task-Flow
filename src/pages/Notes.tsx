import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Plus, Pin, Trash2, Calendar, X, Edit2, Check } from 'lucide-react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Note } from '../types';

const COLORS = [
  { name: 'Amarelo', value: '#FFF9C4' },
  { name: 'Verde', value: '#C8E6C9' },
  { name: 'Azul', value: '#BBDEFB' },
  { name: 'Rosa', value: '#F8BBD0' },
  { name: 'Roxo', value: '#E1BEE7' },
  { name: 'Laranja', value: '#FFE0B2' },
];

export function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState(COLORS[0].value);
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  useEffect(() => {
    loadNotes();
  }, []);

  async function loadNotes() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (err) {
      console.error('Erro ao carregar notas:', err);
      setError('Não foi possível carregar as notas');
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(note: Note) {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content || '');
    setColor(note.color);
    setDueDate(note.due_date || '');
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      if (editingNote) {
        const { error } = await supabase
          .from('notes')
          .update({
            title,
            content,
            color,
            due_date: dueDate || null,
          })
          .eq('id', editingNote.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notes')
          .insert([{
            user_id: user.id,
            title,
            content,
            color,
            due_date: dueDate || null,
          }]);

        if (error) throw error;
      }

      setTitle('');
      setContent('');
      setColor(COLORS[0].value);
      setDueDate('');
      setShowModal(false);
      setEditingNote(null);
      loadNotes();
    } catch (err) {
      console.error('Erro ao salvar nota:', err);
      setError(`Não foi possível ${editingNote ? 'atualizar' : 'adicionar'} a nota`);
    }
  }

  async function handleTogglePin(noteId: string, pinned: boolean) {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ pinned: !pinned })
        .eq('id', noteId);

      if (error) throw error;
      loadNotes();
    } catch (err) {
      console.error('Erro ao atualizar nota:', err);
      setError('Não foi possível atualizar a nota');
    }
  }

  async function handleToggleComplete(noteId: string, completed: boolean) {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ completed: !completed })
        .eq('id', noteId);

      if (error) throw error;
      loadNotes();
    } catch (err) {
      console.error('Erro ao atualizar nota:', err);
      setError('Não foi possível atualizar a nota');
    }
  }

  async function handleDeleteNote(noteId: string) {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      loadNotes();
    } catch (err) {
      console.error('Erro ao deletar nota:', err);
      setError('Não foi possível deletar a nota');
    }
  }

  function formatDueDate(date: string) {
    const parsedDate = parseISO(date);
    if (isToday(parsedDate)) return 'Hoje';
    if (isTomorrow(parsedDate)) return 'Amanhã';
    return format(parsedDate, "d 'de' MMMM", { locale: ptBR });
  }

  function handleCloseModal() {
    setShowModal(false);
    setEditingNote(null);
    setTitle('');
    setContent('');
    setColor(COLORS[0].value);
    setDueDate('');
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Notas</h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="relative group"
              style={{ backgroundColor: note.color }}
            >
              <div className="absolute -rotate-2 w-full h-full rounded-lg shadow-md transition-transform group-hover:-rotate-1"></div>
              <div 
                className={`relative p-4 rounded-lg shadow-lg transform transition-transform group-hover:scale-105 ${
                  note.completed ? 'opacity-75' : ''
                }`} 
                style={{ backgroundColor: note.color }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className={`font-semibold text-gray-800 break-words flex-grow ${
                    note.completed ? 'line-through' : ''
                  }`}>
                    {note.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleComplete(note.id, note.completed)}
                      className={`text-gray-600 hover:text-gray-800 ${
                        note.completed ? 'text-green-600' : ''
                      }`}
                    >
                      <Check size={16} className={note.completed ? 'fill-current' : ''} />
                    </button>
                    <button
                      onClick={() => handleTogglePin(note.id, note.pinned)}
                      className={`text-gray-600 hover:text-gray-800 ${
                        note.pinned ? 'text-blue-600' : ''
                      }`}
                    >
                      <Pin size={16} className={note.pinned ? 'fill-current' : ''} />
                    </button>
                    <button
                      onClick={() => handleEdit(note)}
                      className="text-gray-600 hover:text-blue-600"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-gray-600 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                {note.content && (
                  <p className={`text-gray-700 whitespace-pre-wrap break-words mb-2 ${
                    note.completed ? 'line-through' : ''
                  }`}>
                    {note.content}
                  </p>
                )}
                {note.due_date && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar size={14} className="mr-1" />
                    {formatDueDate(note.due_date)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {editingNote ? 'Editar Nota' : 'Nova Nota'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Digite o título da nota"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Conteúdo
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Digite o conteúdo da nota"
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cor
                  </label>
                  <div className="flex gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setColor(c.value)}
                        className={`w-8 h-8 rounded-full border-2 ${
                          color === c.value ? 'border-blue-500' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar size={16} className="inline mr-1" />
                    Data (opcional)
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Plus size={20} className="mr-2" />
                  {editingNote ? 'Salvar Alterações' : 'Adicionar Nota'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}