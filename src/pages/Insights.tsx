import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { supabase } from '../lib/supabase';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, CheckCircle, Clock, Target, TrendingUp, AlertCircle } from 'lucide-react';

interface TaskStats {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  weeklyData: Array<{
    date: string;
    completionRate: number;
  }>;
  priorityDistribution: {
    baixa: number;
    media: number;
    alta: number;
    urgente: number;
  };
  averageCompletionTime: number;
}

export function Insights() {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [stats, setStats] = useState<TaskStats>({
    totalTasks: 0,
    completedTasks: 0,
    completionRate: 0,
    weeklyData: [],
    priorityDistribution: {
      baixa: 0,
      media: 0,
      alta: 0,
      urgente: 0
    },
    averageCompletionTime: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [period]);

  async function loadStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const endDate = new Date();
      const startDate = period === 'week' 
        ? startOfWeek(endDate, { weekStartsOn: 1 })
        : subMonths(endDate, 1);

      // Fetch all tasks for the period
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .gte('due_date', format(startDate, 'yyyy-MM-dd'))
        .lte('due_date', format(endDate, 'yyyy-MM-dd'));

      if (error) throw error;

      // Calculate statistics
      const totalTasks = tasks?.length || 0;
      const completedTasks = tasks?.filter(task => task.completed).length || 0;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      // Calculate priority distribution
      const priorityDistribution = tasks?.reduce((acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      }, { baixa: 0, media: 0, alta: 0, urgente: 0 });

      // Calculate weekly data
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
      const weeklyData = dateRange.map(date => {
        const dayTasks = tasks?.filter(task => 
          task.due_date === format(date, 'yyyy-MM-dd')
        ) || [];
        const dayCompleted = dayTasks.filter(task => task.completed).length;
        const dayTotal = dayTasks.length;
        
        return {
          date: format(date, 'dd/MM'),
          completionRate: dayTotal > 0 ? (dayCompleted / dayTotal) * 100 : 0
        };
      });

      setStats({
        totalTasks,
        completedTasks,
        completionRate,
        weeklyData,
        priorityDistribution,
        averageCompletionTime: 0 // This could be calculated if we track completion timestamps
      });
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    } finally {
      setLoading(false);
    }
  }

  const priorityColors = {
    baixa: 'bg-green-100 text-green-800',
    media: 'bg-blue-100 text-blue-800',
    alta: 'bg-orange-100 text-orange-800',
    urgente: 'bg-red-100 text-red-800'
  };

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
          <h1 className="text-3xl font-bold text-gray-800">Métricas</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setPeriod('week')}
              className={`px-4 py-2 rounded-lg ${
                period === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Esta Semana
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-4 py-2 rounded-lg ${
                period === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Este Mês
            </button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Total de Tarefas</h3>
              <Target className="text-blue-500" size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalTasks}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Tarefas Concluídas</h3>
              <CheckCircle className="text-green-500" size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.completedTasks}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Taxa de Conclusão</h3>
              <TrendingUp className="text-purple-500" size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats.completionRate.toFixed(1)}%
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Tempo Médio</h3>
              <Clock className="text-orange-500" size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-900">--</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Progress Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-6">
              Progresso ao Longo do Tempo
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.weeklyData}>
                  <XAxis 
                    dataKey="date" 
                    stroke="#6B7280"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#6B7280"
                    fontSize={12}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Taxa de Conclusão']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completionRate" 
                    stroke="#6366F1" 
                    strokeWidth={2}
                    dot={{ fill: '#6366F1', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Priority Distribution */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-6">
              Distribuição por Prioridade
            </h3>
            <div className="space-y-4">
              {Object.entries(stats.priorityDistribution).map(([priority, count]) => (
                <div key={priority} className="flex items-center">
                  <div className={`w-32 text-sm ${priorityColors[priority]} px-3 py-1 rounded-full`}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </div>
                  <div className="flex-1 ml-4">
                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          priority === 'baixa' ? 'bg-green-500' :
                          priority === 'media' ? 'bg-blue-500' :
                          priority === 'alta' ? 'bg-orange-500' :
                          'bg-red-500'
                        }`}
                        style={{
                          width: `${(count / stats.totalTasks) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                  <span className="ml-4 text-sm text-gray-600">
                    {count} ({((count / stats.totalTasks) * 100).toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Smart Insights */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-6">
            Insights Inteligentes
          </h3>
          <div className="space-y-4">
            {stats.completionRate < 50 && (
              <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
                <AlertCircle className="text-red-500 flex-shrink-0" size={24} />
                <div>
                  <h4 className="font-medium text-red-800">Taxa de Conclusão Baixa</h4>
                  <p className="text-red-700">
                    Sua taxa de conclusão está abaixo de 50%. Considere reduzir o número de tarefas
                    ou dividir tarefas grandes em subtarefas menores.
                  </p>
                </div>
              </div>
            )}
            
            {stats.completionRate >= 90 && (
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                <CheckCircle className="text-green-500 flex-shrink-0" size={24} />
                <div>
                  <h4 className="font-medium text-green-800">Excelente Desempenho!</h4>
                  <p className="text-green-700">
                    Você está mantendo uma alta taxa de conclusão de tarefas. Continue com o bom trabalho!
                  </p>
                </div>
              </div>
            )}

            {stats.priorityDistribution.urgente > (stats.totalTasks * 0.3) && (
              <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg">
                <AlertCircle className="text-orange-500 flex-shrink-0" size={24} />
                <div>
                  <h4 className="font-medium text-orange-800">Muitas Tarefas Urgentes</h4>
                  <p className="text-orange-700">
                    Você tem um alto número de tarefas marcadas como urgentes. 
                    Considere revisar suas prioridades e planejar com mais antecedência.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}