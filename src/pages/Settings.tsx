import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Save, Moon, Sun, Edit2, X, Check, Camera, Upload } from 'lucide-react';
import type { Profile } from '../types';

const LEVEL_COLORS = {
  1: [
    { name: 'Verde Esmeralda', value: '#10B981', dark: false },
    { name: 'Azul Índigo', value: '#6366F1', dark: false },
    { name: 'Rosa Vibrante', value: '#EC4899', dark: false },
    { name: 'Roxo Violeta', value: '#8B5CF6', dark: false },
    { name: 'Vermelho Coral', value: '#EF4444', dark: false },
    { name: 'Laranja Sunset', value: '#F97316', dark: false },
    { name: 'Amarelo Dourado', value: '#F59E0B', dark: false },
    { name: 'Teal Oceano', value: '#14B8A6', dark: false },
    { name: 'Azul Céu', value: '#3B82F6', dark: false },
    { name: 'Verde Lima', value: '#84CC16', dark: false },
    { name: 'Rosa Suave', value: '#F472B6', dark: false },
    { name: 'Púrpura Real', value: '#A855F7', dark: false },
    { name: 'Ciano Elétrico', value: '#06B6D4', dark: false },
    { name: 'Verde Floresta', value: '#059669', dark: false },
    { name: 'Vermelho Rubi', value: '#DC2626', dark: false },
    { name: 'Azul Marinho', value: '#1E40AF', dark: false }
  ],
  2: [
    { name: 'Dourado Premium', value: '#D97706', dark: false },
    { name: 'Prata Metálico', value: '#6B7280', dark: false },
    { name: 'Bronze Antigo', value: '#92400E', dark: false },
    { name: 'Turquesa Tropical', value: '#0891B2', dark: false }
  ],
  3: [
    { name: 'Platina Luxo', value: '#374151', dark: false },
    { name: 'Ametista Profunda', value: '#7C3AED', dark: false },
    { name: 'Esmeralda Escura', value: '#047857', dark: false }
  ],
  4: [
    { name: 'Diamante Negro', value: '#111827', dark: true },
    { name: 'Ouro Rosa', value: '#BE185D', dark: false },
    { name: 'Safira Real', value: '#1E3A8A', dark: true }
  ]
};

export function Settings() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedColor, setSelectedColor] = useState('#10B981');
  const [userData, setUserData] = useState({ name: '', email: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserData({
        name: user.user_metadata.name || '',
        email: user.email || '',
      });
      setEditedName(user.user_metadata.name || '');

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      setProfile(profile);
      setSelectedColor(profile.theme_color);
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
    } finally {
      setLoading(false);
    }
  }

  function convertToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Por favor, selecione apenas arquivos de imagem.' });
      return;
    }

    // Validate file size (max 2MB for base64 storage)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'A imagem deve ter no máximo 2MB.' });
      return;
    }

    try {
      setUploading(true);
      setMessage(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Convert image to base64
      const base64Image = await convertToBase64(file);

      // Update user profile with base64 image
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: base64Image })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setMessage({ type: 'success', text: 'Foto de perfil atualizada com sucesso!' });
      loadProfile();
    } catch (err) {
      console.error('Erro ao fazer upload da imagem:', err);
      setMessage({ type: 'error', text: 'Erro ao fazer upload da imagem. Tente novamente.' });
    } finally {
      setUploading(false);
    }
  }

  async function handleUpdateProfile() {
    try {
      setSaving(true);
      setMessage(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      if (isEditing) {
        // Update user metadata
        const { error: userError } = await supabase.auth.updateUser({
          data: { name: editedName }
        });

        if (userError) throw userError;
      }

      // Update profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ theme_color: selectedColor })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      setIsEditing(false);
      loadProfile();
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      setMessage({ type: 'error', text: 'Erro ao atualizar perfil' });
    } finally {
      setSaving(false);
    }
  }

  async function toggleDarkMode() {
    if (!profile) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newDarkMode = !profile.dark_mode;

      if (newDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      setProfile({ ...profile, dark_mode: newDarkMode });

      const { error } = await supabase
        .from('user_profiles')
        .update({ dark_mode: newDarkMode })
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (err) {
      console.error('Erro ao atualizar tema:', err);
      if (profile.dark_mode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      setProfile({ ...profile });
    }
  }

  async function removeAvatar() {
    try {
      setUploading(true);
      setMessage(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Remove avatar by setting avatar_url to null
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: null })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setMessage({ type: 'success', text: 'Foto de perfil removida com sucesso!' });
      loadProfile();
    } catch (err) {
      console.error('Erro ao remover avatar:', err);
      setMessage({ type: 'error', text: 'Erro ao remover a foto de perfil.' });
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
        </div>
      </Layout>
    );
  }

  const availableThemes = Object.entries(LEVEL_COLORS)
    .filter(([level]) => parseInt(level) <= (profile?.level || 0))
    .flatMap(([_, colors]) => colors);

  // Generate avatar URL using DiceBear as fallback
  const fallbackAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userData.name)}&backgroundColor=b6e3f4`;
  const avatarUrl = profile?.avatar_url || fallbackAvatarUrl;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">Configurações</h1>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-emerald-50 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200' 
                : 'bg-red-50 dark:bg-red-900/50 text-red-800 dark:text-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          {/* Profile Info */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                Informações do Perfil
              </h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {isEditing ? (
                  <>
                    <X size={18} />
                    Cancelar
                  </>
                ) : (
                  <>
                    <Edit2 size={18} />
                    Editar
                  </>
                )}
              </button>
            </div>

            {/* Avatar Section */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative">
                <img
                  src={avatarUrl}
                  alt="Avatar do usuário"
                  className="w-32 h-32 rounded-full bg-gray-100 dark:bg-gray-700 object-cover border-4 border-white dark:border-gray-600 shadow-lg"
                />
                <div className="absolute bottom-0 right-0 flex gap-1">
                  <label className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                    {uploading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600 dark:border-gray-300"></div>
                    ) : (
                      <Camera size={20} className="text-gray-600 dark:text-gray-300" />
                    )}
                  </label>
                  {profile?.avatar_url && (
                    <button
                      onClick={removeAvatar}
                      disabled={uploading}
                      className="bg-red-500 hover:bg-red-600 rounded-full p-2 shadow-lg transition-colors disabled:opacity-50"
                      title="Remover foto"
                    >
                      <X size={20} className="text-white" />
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center max-w-xs">
                {profile?.avatar_url 
                  ? 'Clique no ícone da câmera para alterar ou no X para remover sua foto'
                  : 'Clique no ícone da câmera para adicionar uma foto de perfil personalizada'
                }
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{userData.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <p className="text-gray-900 dark:text-white">{userData.email}</p>
              </div>
            </div>
          </div>

          {/* Theme Settings */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">Tema</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Cores Disponíveis (Nível {profile?.level})
                </label>
                <div className="grid grid-cols-8 gap-3">
                  {availableThemes.map((theme) => (
                    <div key={theme.value} className="flex flex-col items-center">
                      <button
                        onClick={() => setSelectedColor(theme.value)}
                        className={`w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                          selectedColor === theme.value
                            ? 'border-gray-900 dark:border-white scale-110 shadow-lg'
                            : 'border-transparent hover:scale-105 hover:shadow-md'
                        }`}
                        style={{ backgroundColor: theme.value }}
                        title={theme.name}
                      />
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center leading-tight">
                        {theme.name.split(' ')[0]}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  Complete mais tarefas para desbloquear cores exclusivas nos próximos níveis!
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Modo Escuro
                </label>
                <button
                  onClick={toggleDarkMode}
                  className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                >
                  {profile?.dark_mode ? (
                    <>
                      <Sun size={20} className="mr-2" />
                      Mudar para Modo Claro
                    </>
                  ) : (
                    <>
                      <Moon size={20} className="mr-2" />
                      Mudar para Modo Escuro
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Level Info */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">Progresso</h2>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-300">Nível {profile?.level}</span>
                <span className="text-gray-600 dark:text-gray-300">
                  {100 - (profile?.experience || 0) % 100} XP para o próximo nível
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300 ease-out"
                  style={{
                    width: `${((profile?.experience || 0) % 100)}%`,
                    backgroundColor: selectedColor
                  }}
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Total de XP: {profile?.experience || 0}
              </p>
            </div>
          </div>

          {/* Save Button */}
          {(isEditing || selectedColor !== profile?.theme_color) && (
            <div className="p-6">
              <button
                onClick={handleUpdateProfile}
                disabled={saving}
                className="w-full flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save size={20} className="mr-2" />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}