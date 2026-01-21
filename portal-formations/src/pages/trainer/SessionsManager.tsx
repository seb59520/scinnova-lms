import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { TrainerHeader } from '../../components/trainer/TrainerHeader';
import { supabase } from '../../lib/supabaseClient';
import type { Session, Course, Org } from '../../types/database';
import {
  Plus, Calendar, Users, BookOpen, Play, Pause, Archive,
  Edit, Trash2, ChevronRight, Radio, Settings
} from 'lucide-react';

interface SessionWithDetails extends Session {
  course?: { title: string };
  org?: { name: string };
  enrollments_count?: number;
}

export function SessionsManager() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    course_id: '',
    org_id: '',
    start_date: '',
    end_date: '',
    status: 'draft' as Session['status']
  });
  const [editingSession, setEditingSession] = useState<Session | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    if (!user) return;
    setLoading(true);

    try {
      // Charger les sessions avec détails
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
          *,
          course:courses(title),
          org:orgs(name)
        `)
        .order('created_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      // Compter les enrollments pour chaque session
      const sessionsWithCounts = await Promise.all(
        (sessionsData || []).map(async (session: any) => {
          const { count } = await supabase
            .from('enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', session.id)
            .eq('status', 'active');
          
          return {
            ...session,
            enrollments_count: count || 0
          };
        })
      );

      setSessions(sessionsWithCounts);

      // Charger les cours
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .eq('status', 'published')
        .order('title');
      setCourses(coursesData || []);

      // Charger les organisations
      const { data: orgsData } = await supabase
        .from('orgs')
        .select('*')
        .order('name');
      setOrgs(orgsData || []);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateSession() {
    if (!formData.title || !formData.course_id || !formData.org_id) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          ...formData,
          created_by: user?.id,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null
        })
        .select()
        .single();

      if (error) throw error;

      // Rafraîchir la liste
      await loadData();
      setShowCreateModal(false);
      resetForm();

    } catch (error) {
      console.error('Error creating session:', error);
      alert('Erreur lors de la création de la session');
    }
  }

  async function handleUpdateSession() {
    if (!editingSession) return;

    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          title: formData.title,
          course_id: formData.course_id,
          org_id: formData.org_id,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          status: formData.status
        })
        .eq('id', editingSession.id);

      if (error) throw error;

      await loadData();
      setEditingSession(null);
      resetForm();

    } catch (error) {
      console.error('Error updating session:', error);
      alert('Erreur lors de la mise à jour');
    }
  }

  async function handleDeleteSession(sessionId: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette session ?')) return;

    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
      await loadData();

    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Erreur lors de la suppression');
    }
  }

  async function handleStatusChange(sessionId: string, newStatus: Session['status']) {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ status: newStatus })
        .eq('id', sessionId);

      if (error) throw error;
      await loadData();

    } catch (error) {
      console.error('Error updating status:', error);
    }
  }

  function resetForm() {
    setFormData({
      title: '',
      course_id: '',
      org_id: '',
      start_date: '',
      end_date: '',
      status: 'draft'
    });
  }

  function openEditModal(session: Session) {
    setEditingSession(session);
    setFormData({
      title: session.title,
      course_id: session.course_id,
      org_id: session.org_id,
      start_date: session.start_date?.split('T')[0] || '',
      end_date: session.end_date?.split('T')[0] || '',
      status: session.status
    });
  }

  const getStatusBadge = (status: Session['status']) => {
    const config = {
      draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700' },
      active: { label: 'Active', color: 'bg-green-100 text-green-700' },
      completed: { label: 'Terminée', color: 'bg-blue-100 text-blue-700' },
      archived: { label: 'Archivée', color: 'bg-gray-100 text-gray-500' }
    };
    const { label, color } = config[status];
    return <span className={`px-2 py-1 text-xs rounded-full ${color}`}>{label}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TrainerHeader />
        <div className="pt-8 flex items-center justify-center">
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TrainerHeader />

      <div className="pt-8 max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des sessions</h1>
            <p className="text-gray-500">Créez et gérez vos sessions de formation</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Nouvelle session
          </button>
        </div>

        {/* Liste des sessions */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {sessions.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Calendar className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg">Aucune session créée</p>
              <p className="text-sm mt-2">Créez votre première session de formation</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Créer une session
              </button>
            </div>
          ) : (
            <div className="divide-y">
              {sessions.map(session => (
                <div key={session.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-6">
                    {/* Infos principales */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-medium text-gray-900">{session.title}</h3>
                        {getStatusBadge(session.status)}
                      </div>
                      
                      <div className="flex items-center gap-6 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          {session.course?.title || 'Cours inconnu'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {session.enrollments_count || 0} apprenants
                        </span>
                        {session.start_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(session.start_date).toLocaleDateString('fr-FR')}
                            {session.end_date && ` - ${new Date(session.end_date).toLocaleDateString('fr-FR')}`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions rapides */}
                    <div className="flex items-center gap-2">
                      {session.status === 'draft' && (
                        <button
                          onClick={() => handleStatusChange(session.id, 'active')}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Activer"
                        >
                          <Play className="h-5 w-5" />
                        </button>
                      )}
                      {session.status === 'active' && (
                        <>
                          <Link
                            to={`/trainer/session/${session.id}`}
                            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            title="Ouvrir la session"
                          >
                            <Radio className="h-4 w-4" />
                            Ouvrir
                          </Link>
                          <button
                            onClick={() => handleStatusChange(session.id, 'completed')}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"
                            title="Terminer"
                          >
                            <Pause className="h-5 w-5" />
                          </button>
                        </>
                      )}
                      {session.status === 'completed' && (
                        <button
                          onClick={() => handleStatusChange(session.id, 'archived')}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Archiver"
                        >
                          <Archive className="h-5 w-5" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => openEditModal(session)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        title="Modifier"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Supprimer"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>

                      <Link
                        to={`/trainer/session/${session.id}`}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title="Voir la session"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Création/Édition */}
      {(showCreateModal || editingSession) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {editingSession ? 'Modifier la session' : 'Nouvelle session'}
            </h2>

            <div className="space-y-4">
              {/* Titre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre de la session *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Formation Python - Janvier 2026"
                />
              </div>

              {/* Cours */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cours associé *
                </label>
                <select
                  value={formData.course_id}
                  onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Sélectionner un cours</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                </select>
              </div>

              {/* Organisation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organisation *
                </label>
                <select
                  value={formData.org_id}
                  onChange={(e) => setFormData({ ...formData, org_id: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Sélectionner une organisation</option>
                  {orgs.map(org => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de début
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Statut (uniquement en édition) */}
              {editingSession && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Session['status'] })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="draft">Brouillon</option>
                    <option value="active">Active</option>
                    <option value="completed">Terminée</option>
                    <option value="archived">Archivée</option>
                  </select>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingSession(null);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Annuler
              </button>
              <button
                onClick={editingSession ? handleUpdateSession : handleCreateSession}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingSession ? 'Enregistrer' : 'Créer la session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
