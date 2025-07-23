import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react';

interface AuthFormProps {
  onSuccess: () => void;
}

export function AuthForm({ onSuccess }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name,
            },
          },
        });
        if (error) throw error;

        // Cria Perfil Do Usuario
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert([
            {
              user_id: data.user!.id,
              level: 1,
              experience: 0,
              theme_color: '#10B981',
              dark_mode: false,
            },
          ]);

        if (profileError) throw profileError;
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8 p-4 md:p-8">
        {/* Lado Esquerdo - Ilustração */}
        <div className="hidden md:flex flex-col justify-center items-center text-white">
          <div className="relative w-full max-w-md">
            {/* Ilustração de foguete */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 bg-blue-500 rounded-full opacity-20 animate-pulse"></div>
            </div>
            <svg viewBox="0 0 400 300" className="w-full h-auto">
              <path
                d="M179.5,148.8c0,0-19.6-2.4-33.1,11.1c-13.5,13.5-11.1,33.1-11.1,33.1s19.6,2.4,33.1-11.1
                C181.9,168.4,179.5,148.8,179.5,148.8z"
                fill="#3B82F6"
              />
              <path
                d="M200,120c-44.1,0-80,35.9-80,80s35.9,80,80,80s80-35.9,80-80S244.1,120,200,120z M200,260c-33.1,0-60-26.9-60-60
                s26.9-60,60-60s60,26.9,60,60S233.1,260,200,260z"
                fill="#60A5FA"
              />
              <circle cx="200" cy="200" r="40" fill="#93C5FD" />
            </svg>
            <h1 className="text-3xl md:text-4xl font-bold text-center mt-8 mb-4">
              TaskFlow
            </h1>
            <p className="text-lg text-center text-blue-200">
              Organize suas tarefas. Aumente sua produtividade.
            </p>
          </div>
        </div>

        {/* Lado Direito - Formulário */}
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
            <h2 className="text-3xl font-bold text-center mb-8 text-white">
              {isLogin ? 'Bem-vindo de volta' : 'Criar conta'}
            </h2>
            
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300" size={20} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nome"
                    required={!isLogin}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-blue-200"
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-blue-200"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-blue-200"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-blue-900 disabled:opacity-50 transition-all duration-200 flex items-center justify-center space-x-2 group"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <span>{isLogin ? 'Entrar' : 'Cadastrar'}</span>
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <p className="text-center text-blue-200">
                {isLogin ? "Não tem uma conta? " : "Já tem uma conta? "}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-blue-400 hover:text-blue-300 font-medium focus:outline-none focus:underline"
                >
                  {isLogin ? 'Cadastre-se' : 'Entre'}
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}