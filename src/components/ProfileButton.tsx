import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

// Create a custom event for theme changes
export const themeChangeEvent = new Event('themeChange');

export function ProfileButton() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userName, setUserName] = useState<string>('User');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    // Aplicar classe de modo escuro com base na configuração do perfil
    if (profile?.dark_mode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [profile?.dark_mode]);

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Set the user name for avatar generation
      setUserName(user.user_metadata?.name || 'User');

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      setProfile(profile);
      // Ensure dark mode is applied correctly on initial load
      if (profile.dark_mode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse flex items-center px-6 py-3">
        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600"></div>
        <div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded ml-2"></div>
      </div>
    );
  }

  if (!profile) return null;

  // Generate avatar URL using DiceBear as fallback
  const fallbackAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName)}&backgroundColor=b6e3f4`;
  const avatarUrl = profile.avatar_url || fallbackAvatarUrl;

  return (
    <button
      onClick={() => navigate('/settings')}
      className="flex items-center space-x-2 w-full px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-emerald-900 dark:hover:text-emerald-50 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
    >
      <img
        src={avatarUrl}
        alt="Avatar do usuário"
        className="w-5 h-5 rounded-full object-cover"
        onError={(e) => {
          // Fallback to User icon if image fails to load
          e.currentTarget.style.display = 'none';
          e.currentTarget.nextElementSibling?.classList.remove('hidden');
        }}
      />
      <User size={20} className="hidden" />
      <span>Perfil</span>
    </button>
  );
}