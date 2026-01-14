import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { TrainerHeader } from '../../components/trainer/TrainerHeader';
import {
  ClipboardCheck, Users, CheckCircle, Clock, Award, Settings,
  ExternalLink, Play, Pause, FileText, ChevronRight, Plus
} from 'lucide-react';

interface ProjectOverview {
  id: string;
  title: string;
  status: string;
  session_id: string;
  session_title: string;
  submissions_count: number;
  evaluated_count: number;
  average_score: number | null;
  deadline: string | null;
  created_at: string;
}

export function AllProjectsOverview() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectOverview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'grading' | 'completed'>('all');

  useEffect(() => {
    loadProjects();
  }, [user]);

  const loadProjects = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    // Charger toutes les restitutions de projet avec les stats
    const { data: restitutions, error } = await supabase
      .from('session_project_restitutions')
      .select(`
        id,
        title,
        status,
        deadline,
        created_at,
        session_id,
        sessions!inner (
          title
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading projects:', error);
      setIsLoading(false);
      return;
    }

    // Pour chaque restitution, charger les stats de soumissions
    const projectsWithStats: ProjectOverview[] = [];
    
    for (const r of restitutions || []) {
      // Compter les soumissions
      const { count: submissionsCount } = await supabase
        .from('project_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('restitution_id', r.id)
        .in('status', ['submitted', 'evaluated']);

      // Compter les évaluations
      const { count: evaluatedCount } = await supabase
        .from('project_evaluations')
        .select('*', { count: 'exact', head: true })
        .eq('restitution_id', r.id);

      // Moyenne des notes
      const { data: avgData } = await supabase
        .from('project_evaluations')
        .select('final_score')
        .eq('restitution_id', r.id);
      
      const avgScore = avgData && avgData.length > 0
        ? avgData.reduce((sum, e) => sum + (e.final_score || 0), 0) / avgData.length
        : null;

      projectsWithStats.push({
        id: r.id,
        title: r.title,
        status: r.status,
        session_id: r.session_id,
        session_title: (r.sessions as any)?.title || 'Session',
        submissions_count: submissionsCount || 0,
        evaluated_count: evaluatedCount || 0,
        average_score: avgScore,
        deadline: r.deadline,
        created_at: r.created_at
      });
    }

    setProjects(projectsWithStats);
    setIsLoading(false);
  };

  const filteredProjects = projects.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'open') return p.status === 'open';
    if (filter === 'grading') return p.status === 'grading' || (p.status === 'open' && p.submissions_count > p.evaluated_count);
    if (filter === 'completed') return p.status === 'completed';
    return true;
  });

  const stats = {
    total: projects.length,
    open: projects.filter(p => p.status === 'open').length,
    toEvaluate: projects.reduce((sum, p) => sum + (p.submissions_count - p.evaluated_count), 0),
    completed: projects.filter(p => p.status === 'completed').length
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Brouillon' },
      open: { bg: 'bg-green-100', text: 'text-green-700', label: 'Ouvert' },
      closed: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Fermé' },
      grading: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Évaluation' },
      completed: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Terminé' }
    };
    const badge = badges[status] || badges.draft;
    return (
      <span className={`px-2 py-0.5 text-xs rounded-full ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TrainerHeader />
        <div className="pt-28 flex items-center justify-center">
          <div className="text-gray-500">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TrainerHeader />

      <div className="max-w-6xl mx-auto px-4 py-6 pt-28">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Restitutions de projet</h1>
            <p className="text-gray-500">Vue d'ensemble de tous vos projets</p>
          </div>
          <Link
            to="/trainer/project-templates"
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <Settings className="h-5 w-5" />
            Gérer les templates
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <ClipboardCheck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-500">Total projets</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Play className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.open}</div>
                <div className="text-sm text-gray-500">En cours</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.toEvaluate}</div>
                <div className="text-sm text-gray-500">À évaluer</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.completed}</div>
                <div className="text-sm text-gray-500">Terminés</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex gap-2 mb-4">
          {[
            { value: 'all', label: 'Tous' },
            { value: 'open', label: 'En cours' },
            { value: 'grading', label: 'À évaluer' },
            { value: 'completed', label: 'Terminés' }
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Liste des projets */}
        {filteredProjects.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FileText className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-medium text-gray-600 mb-2">
              Aucun projet
            </h2>
            <p className="text-gray-500 mb-6">
              Créez une restitution de projet depuis une session
            </p>
            <Link
              to="/trainer/sessions"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-5 w-5" />
              Voir les sessions
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProjects.map(project => (
              <Link
                key={project.id}
                to={`/trainer/session/${project.session_id}/project/${project.id}/evaluate`}
                className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-gray-900">{project.title}</h3>
                        {getStatusBadge(project.status)}
                        {project.submissions_count > project.evaluated_count && project.status === 'open' && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">
                            {project.submissions_count - project.evaluated_count} à évaluer
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        Session : {project.session_title}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">
                          {project.submissions_count}
                        </div>
                        <div className="text-xs text-gray-500">Soumissions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-600">
                          {project.evaluated_count}
                        </div>
                        <div className="text-xs text-gray-500">Évalués</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-purple-600">
                          {project.average_score !== null ? `${project.average_score.toFixed(1)}/20` : '-'}
                        </div>
                        <div className="text-xs text-gray-500">Moyenne</div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>

                  {project.deadline && (
                    <div className="mt-2 text-xs text-gray-500">
                      Date limite : {new Date(project.deadline).toLocaleDateString('fr-FR')}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
