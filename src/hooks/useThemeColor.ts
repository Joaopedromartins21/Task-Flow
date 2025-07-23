import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useThemeColor() {
  const [themeColor, setThemeColor] = useState('#10B981');

  useEffect(() => {
    async function loadThemeColor() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('theme_color')
          .eq('user_id', user.id)
          .maybeSingle();

        setThemeColor(profile?.theme_color ?? '#10B981');
      } catch (error) {
        console.error('Error loading theme color:', error);
      }
    }

    loadThemeColor();

    // Subscribe to theme changes
    const channel = supabase
      .channel('theme_changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'user_profiles',
      }, (payload) => {
        if (payload.new?.theme_color) {
          setThemeColor(payload.new.theme_color);
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return themeColor;
}