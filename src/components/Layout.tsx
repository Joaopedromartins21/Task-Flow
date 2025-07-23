import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, BookMarked, Target, Lightbulb, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ProfileButton } from './ProfileButton';
import { useThemeColor } from '../hooks/useThemeColor';
import { useDataStore } from '../hooks/useDataStore';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const themeColor = useThemeColor();
  const fetchData = useDataStore(state => state.fetchData);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 shadow-lg">
        <div className="p-6">
          <h1 
            className="text-2xl font-bold dark:text-white"
            style={{ color: themeColor }}
          >
            TaskFlow
          </h1>
        </div>
        <nav className="mt-6">
          <NavItem 
            icon={<Home size={20} />} 
            label="Início" 
            to="/" 
            active={location.pathname === '/'} 
          />
          <NavItem 
            icon={<BookMarked size={20} />} 
            label="Notas" 
            to="/notes" 
            active={location.pathname === '/notes'} 
          />
          <NavItem 
            icon={<Target size={20} />} 
            label="Objetivos" 
            to="/goals" 
            active={location.pathname === '/goals'} 
          />
          <NavItem 
            icon={<Lightbulb size={20} />} 
            label="Métricas" 
            to="/insights" 
            active={location.pathname === '/insights'} 
          />
          <ProfileButton />
        </nav>
        <div className="absolute bottom-0 w-64 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 p-8 bg-white dark:bg-gray-900">
        {children}
      </div>
    </div>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  active: boolean;
}

function NavItem({ icon, label, to, active }: NavItemProps) {
  const navigate = useNavigate();
  const themeColor = useThemeColor();
  
  return (
    <button
      onClick={() => navigate(to)}
      className={`flex items-center space-x-2 w-full px-6 py-3 transition-colors ${
        active 
          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/50' 
          : 'text-gray-600 dark:text-gray-400 hover:text-emerald-900 dark:hover:text-emerald-50 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
      }`}
      style={active ? { color: themeColor } : undefined}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}