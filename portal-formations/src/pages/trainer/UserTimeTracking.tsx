import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { TrainerHeader } from '../../components/trainer/TrainerHeader';
import { formatDuration } from '../../utils/trainerUtils';
import { Calendar, Clock, Eye, TrendingUp } from 'lucide-react';

interface TimeTrackingData {
  user_id: string;
  full_name: string;
  date: string;
  session_title: string | null;
  course_title: string | null;
  total_seconds: number;
  active_seconds: number;
  page_views: number;
  total_minutes: number;
  active_minutes: number;
  active_hours: number;
  last_activity_at: string;
}

export function UserTimeTracking() {
  const { sessionId, userId } = useParams<{ sessionId?: string; userId?: string }>();
  const navigate = useNavigate();
  const [timeData, setTimeData] = useState<TimeTrackingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 jours
    end: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadTimeData();
  }, [sessionId, userId, dateRange]);

  async function loadTimeData() {
    setLoading(true);
    try {
      let query = supabase
        .from('user_time_stats')
        .select('*')
        .gte('date', dateRange.start)
        .lte('date', dateRange.end)
        .order('date', { ascending: false });

      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }

      if (userId) {
        query = query.eq('user_id', userId);
      }

      // Pour les admins, on peut voir toutes les données
      // Les RLS policies gèrent déjà les permissions
      const { data, error } = await query;

      if (error) throw error;

      setTimeData(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  }

  // Calculer les statistiques globales
  const totalActiveHours = timeData.reduce((sum, d) => sum + (d.active_hours || 0), 0);
  const totalActiveMinutes = timeData.reduce((sum, d) => sum + (d.active_minutes || 0), 0);
  const totalPageViews = timeData.reduce((sum, d) => sum + (d.page_views || 0), 0);
  const uniqueDays = new Set(timeData.map((d) => d.date)).size;
  const avgDailyMinutes = uniqueDays > 0 ? totalActiveMinutes / uniqueDays : 0;

  // Grouper par utilisateur
  const byUser = timeData.reduce((acc, d) => {
    if (!acc[d.user_id]) {
      acc[d.user_id] = {
        user_id: d.user_id,
        full_name: d.full_name,
        total_active_hours: 0,
        total_active_minutes: 0,
        total_page_views: 0,
        days_active: new Set<string>(),
      };
    }
    acc[d.user_id].total_active_hours += d.active_hours || 0;
    acc[d.user_id].total_active_minutes += d.active_minutes || 0;
    acc[d.user_id].total_page_views += d.page_views || 0;
    acc[d.user_id].days_active.add(d.date);
    return acc;
  }, {} as Record<string, {
    user_id: string;
    full_name: string;
    total_active_hours: number;
    total_active_minutes: number;
    total_page_views: number;
    days_active: Set<string>;
  }>);

  const usersList = Object.values(byUser).map((u) => ({
    ...u,
    days_active: u.days_active.size,
    avg_daily_minutes: u.days_active.size > 0 ? u.total_active_minutes / u.days_active.size : 0,
  })).sort((a, b) => b.total_active_hours - a.total_active_hours);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TrainerHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TrainerHeader />
      <div className="p-6 pt-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Temps passé sur l'application</h1>
              <p className="mt-2 text-gray-600">Suivi du temps actif par utilisateur</p>
            </div>
            <button
              onClick={() => navigate('/trainer')}
              className="rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
            >
              Retour
            </button>
          </div>

          {/* Filtres */}
          <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
            <div className="flex gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de début
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Statistiques globales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-medium text-gray-600">Temps actif total</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {totalActiveHours.toFixed(1)}h
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {totalActiveMinutes.toFixed(0)} minutes
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-green-600" />
                <h3 className="text-sm font-medium text-gray-600">Jours actifs</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">{uniqueDays}</p>
              <p className="text-xs text-gray-500 mt-1">
                Moyenne: {avgDailyMinutes.toFixed(1)} min/jour
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-medium text-gray-600">Vues de pages</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">{totalPageViews}</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                <h3 className="text-sm font-medium text-gray-600">Utilisateurs actifs</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">{usersList.length}</p>
            </div>
          </div>

          {/* Tableau par utilisateur */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Temps par utilisateur</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Utilisateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Temps actif total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Jours actifs
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Moyenne/jour
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Vues de pages
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {usersList.map((user) => (
                    <tr key={user.user_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{user.full_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.total_active_hours.toFixed(1)}h
                        </div>
                        <div className="text-xs text-gray-500">
                          {user.total_active_minutes.toFixed(0)} minutes
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.days_active} jour{user.days_active > 1 ? 's' : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.avg_daily_minutes.toFixed(1)} min/jour
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.total_page_views}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Détail par jour */}
          {timeData.length > 0 && (
            <div className="mt-6 bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Détail par jour</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Utilisateur
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Session
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Cours
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Temps actif
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Vues
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Dernière activité
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {timeData.map((data, index) => (
                      <tr key={`${data.user_id}-${data.date}-${index}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(data.date).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {data.full_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {data.session_title || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {data.course_title || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {data.active_hours.toFixed(1)}h ({data.active_minutes.toFixed(0)} min)
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {data.page_views}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {data.last_activity_at
                            ? new Date(data.last_activity_at).toLocaleString('fr-FR')
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


