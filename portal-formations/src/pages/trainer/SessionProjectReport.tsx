import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { TrainerHeader } from '../../components/trainer/TrainerHeader';
import {
  FileText, Download, Users, Award, BarChart3, ChevronLeft,
  CheckCircle, XCircle, Clock, Star, ExternalLink, Printer
} from 'lucide-react';

interface LearnerReport {
  id: string;
  full_name: string;
  email: string;
  submission?: {
    id: string;
    project_title: string;
    project_description?: string;
    presentation_link?: string;
    app_link?: string;
    documentation_link?: string;
    video_link?: string;
    tools_used: any[];
    submitted_at?: string;
    status: string;
  };
  evaluation?: {
    score_20?: number;
    final_score?: number;
    passed?: boolean;
    criteria_scores: Record<string, { stars: number; comment?: string }>;
    strengths?: string;
    improvements?: string;
    global_feedback?: string;
  };
}

interface RestitutionData {
  id: string;
  title: string;
  description?: string;
  criteria: Array<{ id: string; name: string; weight: number; max_stars: number }>;
  due_date?: string;
  status: string;
}

interface SessionData {
  id: string;
  title: string;
  start_date?: string;
  end_date?: string;
  course?: {
    title: string;
  };
}

export function SessionProjectReport() {
  const { sessionId, restitutionId } = useParams<{ sessionId: string; restitutionId: string }>();
  
  const [session, setSession] = useState<SessionData | null>(null);
  const [restitution, setRestitution] = useState<RestitutionData | null>(null);
  const [learnerReports, setLearnerReports] = useState<LearnerReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLearner, setSelectedLearner] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!sessionId || !restitutionId) return;

      setIsLoading(true);

      try {
        // Charger la session
        const { data: sessionData } = await supabase
          .from('sessions')
          .select('id, title, start_date, end_date, course:courses(title)')
          .eq('id', sessionId)
          .single();

        setSession(sessionData);

        // Charger la restitution
        const { data: restitutionData } = await supabase
          .from('session_project_restitutions')
          .select('*')
          .eq('id', restitutionId)
          .single();

        setRestitution(restitutionData);

        // Charger les membres de la session (learners) - sans jointure pour éviter les problèmes RLS
        const { data: members, error: membersError } = await supabase
          .from('session_members')
          .select('user_id, role')
          .eq('session_id', sessionId)
          .eq('role', 'learner');

        console.log('📋 Members chargés:', members, membersError);

        // Charger les profils séparément
        const learnerIds = members?.map(m => m.user_id) || [];
        let profiles: any[] = [];
        
        if (learnerIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', learnerIds);
          profiles = profilesData || [];
        }
        
        console.log('📋 Profils chargés:', profiles.length);

        // Charger les soumissions
        const { data: submissions } = await supabase
          .from('project_submissions')
          .select('*')
          .eq('restitution_id', restitutionId);

        // Charger les évaluations
        const { data: evaluations } = await supabase
          .from('project_evaluations')
          .select('*')
          .eq('restitution_id', restitutionId);

        // Construire les rapports par apprenant
        const reports: LearnerReport[] = (members || []).map((m: any) => {
          const profile = profiles.find(p => p.id === m.user_id);
          const submission = submissions?.find(s => s.user_id === m.user_id);
          const evaluation = evaluations?.find(e => e.user_id === m.user_id);

          return {
            id: m.user_id || '',
            full_name: profile?.full_name || 'Inconnu',
            email: profile?.email || '',
            submission: submission ? {
              id: submission.id,
              project_title: submission.project_title,
              project_description: submission.project_description,
              presentation_link: submission.presentation_link,
              app_link: submission.app_link,
              documentation_link: submission.documentation_link,
              video_link: submission.video_link,
              tools_used: submission.tools_used || [],
              submitted_at: submission.submitted_at,
              status: submission.status
            } : undefined,
            evaluation: evaluation ? {
              score_20: evaluation.score_20,
              final_score: evaluation.final_score,
              passed: evaluation.passed,
              criteria_scores: evaluation.criteria_scores || {},
              strengths: evaluation.strengths,
              improvements: evaluation.improvements,
              global_feedback: evaluation.global_feedback
            } : undefined
          };
        });

        setLearnerReports(reports.sort((a, b) => a.full_name.localeCompare(b.full_name)));
      } catch (err) {
        console.error('Error loading report data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [sessionId, restitutionId]);

  // Statistiques globales
  const stats = useMemo(() => {
    const total = learnerReports.length;
    const submitted = learnerReports.filter(r => r.submission).length;
    const evaluated = learnerReports.filter(r => r.evaluation).length;
    const passed = learnerReports.filter(r => r.evaluation?.passed).length;
    
    const scores = learnerReports
      .filter(r => r.evaluation?.final_score || r.evaluation?.score_20)
      .map(r => r.evaluation?.final_score || r.evaluation?.score_20 || 0);
    
    const avgScore = scores.length > 0 
      ? scores.reduce((a, b) => a + b, 0) / scores.length 
      : 0;

    return { total, submitted, evaluated, passed, avgScore };
  }, [learnerReports]);

  // Export CSV
  const exportCSV = () => {
    const headers = [
      'Nom', 'Email', 'Projet soumis', 'Titre du projet', 
      'Date de soumission', 'Note /20', 'Validé', 'Points forts', 'Axes amélioration'
    ];

    const rows = learnerReports.map(r => [
      r.full_name,
      r.email,
      r.submission ? 'Oui' : 'Non',
      r.submission?.project_title || '',
      r.submission?.submitted_at ? new Date(r.submission.submitted_at).toLocaleDateString('fr-FR') : '',
      r.evaluation?.final_score || r.evaluation?.score_20 || '',
      r.evaluation?.passed ? 'Oui' : (r.evaluation ? 'Non' : ''),
      r.evaluation?.strengths || '',
      r.evaluation?.improvements || ''
    ]);

    const csv = [
      `Session: ${session?.title || ''}`,
      `Projet: ${restitution?.title || ''}`,
      `Date d'export: ${new Date().toLocaleDateString('fr-FR')}`,
      '',
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rapport-projet-${restitution?.title || 'export'}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Impression
  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Chargement du rapport...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TrainerHeader />
      
      <div className="max-w-7xl mx-auto px-4 py-6 pt-28 print:pt-4">
        {/* Header */}
        <div className="mb-6 print:mb-4">
          <Link
            to={`/trainer/session/${sessionId}/projects/${restitutionId}`}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-2 print:hidden"
          >
            <ChevronLeft className="h-4 w-4" />
            Retour aux évaluations
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 print:text-xl">
                Compte rendu - {restitution?.title}
              </h1>
              <p className="text-gray-500">
                Session: {session?.title} | {session?.course?.title}
              </p>
              {session?.start_date && (
                <p className="text-sm text-gray-400">
                  Du {new Date(session.start_date).toLocaleDateString('fr-FR')} 
                  {session.end_date && ` au ${new Date(session.end_date).toLocaleDateString('fr-FR')}`}
                </p>
              )}
            </div>
            
            <div className="flex gap-2 print:hidden">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <Printer className="h-4 w-4" />
                Imprimer
              </button>
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Statistiques globales */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 print:grid-cols-5 print:gap-2 print:mb-4">
          <div className="bg-white rounded-lg shadow p-4 print:p-2 print:shadow-none print:border">
            <div className="flex items-center gap-2 text-blue-600">
              <Users className="h-5 w-5 print:h-4 print:w-4" />
              <span className="text-sm font-medium">Apprenants</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 print:text-xl">{stats.total}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 print:p-2 print:shadow-none print:border">
            <div className="flex items-center gap-2 text-purple-600">
              <FileText className="h-5 w-5 print:h-4 print:w-4" />
              <span className="text-sm font-medium">Soumis</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 print:text-xl">
              {stats.submitted}/{stats.total}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 print:p-2 print:shadow-none print:border">
            <div className="flex items-center gap-2 text-orange-600">
              <Star className="h-5 w-5 print:h-4 print:w-4" />
              <span className="text-sm font-medium">Évalués</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 print:text-xl">
              {stats.evaluated}/{stats.submitted}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 print:p-2 print:shadow-none print:border">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5 print:h-4 print:w-4" />
              <span className="text-sm font-medium">Validés</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 print:text-xl">
              {stats.passed}/{stats.evaluated}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 print:p-2 print:shadow-none print:border">
            <div className="flex items-center gap-2 text-indigo-600">
              <BarChart3 className="h-5 w-5 print:h-4 print:w-4" />
              <span className="text-sm font-medium">Moyenne</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 print:text-xl">
              {stats.avgScore.toFixed(1)}/20
            </div>
          </div>
        </div>

        {/* Tableau récapitulatif */}
        <div className="bg-white rounded-lg shadow mb-8 print:shadow-none print:border print:mb-4">
          <div className="px-6 py-4 border-b print:px-4 print:py-2">
            <h2 className="text-lg font-semibold text-gray-900 print:text-base">
              Récapitulatif par apprenant
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Apprenant
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Projet
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Soumis
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Note
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase print:hidden">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {learnerReports.map(report => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{report.full_name}</div>
                      <div className="text-sm text-gray-500">{report.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">
                        {report.submission?.project_title || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {report.submission ? (
                        <span className="text-green-600 text-sm">
                          {new Date(report.submission.submitted_at!).toLocaleDateString('fr-FR')}
                        </span>
                      ) : (
                        <span className="text-red-500 text-sm">Non soumis</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {report.evaluation ? (
                        <span className={`font-bold ${
                          (report.evaluation.final_score || report.evaluation.score_20 || 0) >= 10
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {(report.evaluation.final_score || report.evaluation.score_20)?.toFixed(1)}/20
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {report.evaluation?.passed === true && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          <CheckCircle className="h-3 w-3" />
                          Validé
                        </span>
                      )}
                      {report.evaluation?.passed === false && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                          <XCircle className="h-3 w-3" />
                          Non validé
                        </span>
                      )}
                      {!report.evaluation && report.submission && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                          <Clock className="h-3 w-3" />
                          En attente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 print:hidden">
                      <button
                        onClick={() => setSelectedLearner(selectedLearner === report.id ? null : report.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        {selectedLearner === report.id ? 'Masquer' : 'Détails'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Détails individuels (expandable ou pour l'impression) */}
        <div className="space-y-6 print:space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 print:text-base hidden print:block">
            Fiches individuelles
          </h2>
          
          {learnerReports.filter(r => r.evaluation || selectedLearner === r.id).map(report => (
            <div 
              key={report.id} 
              className={`bg-white rounded-lg shadow p-6 print:shadow-none print:border print:p-4 print:break-inside-avoid ${
                selectedLearner === report.id || 'hidden print:block'
              }`}
            >
              <div className="flex items-start justify-between mb-4 print:mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 print:text-base">
                    {report.full_name}
                  </h3>
                  <p className="text-sm text-gray-500">{report.email}</p>
                </div>
                {report.evaluation && (
                  <div className={`text-2xl font-bold print:text-xl ${
                    report.evaluation.passed ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(report.evaluation.final_score || report.evaluation.score_20)?.toFixed(1)}/20
                  </div>
                )}
              </div>

              {report.submission && (
                <div className="mb-4 print:mb-2">
                  <h4 className="font-medium text-gray-700 mb-2">Projet: {report.submission.project_title}</h4>
                  {report.submission.project_description && (
                    <p className="text-sm text-gray-600 mb-2">{report.submission.project_description}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-2 text-sm">
                    {report.submission.presentation_link && (
                      <a 
                        href={report.submission.presentation_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline print:text-gray-700"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Présentation
                      </a>
                    )}
                    {report.submission.app_link && (
                      <a 
                        href={report.submission.app_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline print:text-gray-700"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Application
                      </a>
                    )}
                  </div>
                  
                  {report.submission.tools_used && report.submission.tools_used.length > 0 && (
                    <div className="mt-2">
                      <span className="text-sm text-gray-500">Outils: </span>
                      <span className="text-sm text-gray-700">
                        {report.submission.tools_used.map((t: any) => t.name).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {report.evaluation && (
                <div className="space-y-3 print:space-y-2">
                  {/* Notes par critère */}
                  {restitution?.criteria && restitution.criteria.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Évaluation par critère:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 print:grid-cols-3">
                        {restitution.criteria.map(criterion => {
                          const score = report.evaluation?.criteria_scores[criterion.id];
                          return (
                            <div key={criterion.id} className="bg-gray-50 p-2 rounded text-sm print:bg-white print:border">
                              <div className="font-medium text-gray-700">{criterion.name}</div>
                              <div className="flex items-center gap-1">
                                {Array.from({ length: criterion.max_stars }, (_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`h-3 w-3 ${
                                      i < (score?.stars || 0) 
                                        ? 'fill-yellow-400 text-yellow-400' 
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                                <span className="text-xs text-gray-500 ml-1">
                                  ({score?.stars || 0}/{criterion.max_stars})
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Feedback */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 print:gap-2">
                    {report.evaluation.strengths && (
                      <div className="bg-green-50 p-3 rounded print:bg-white print:border print:border-green-200">
                        <h5 className="text-sm font-medium text-green-800 mb-1">Points forts</h5>
                        <p className="text-sm text-green-700">{report.evaluation.strengths}</p>
                      </div>
                    )}
                    {report.evaluation.improvements && (
                      <div className="bg-orange-50 p-3 rounded print:bg-white print:border print:border-orange-200">
                        <h5 className="text-sm font-medium text-orange-800 mb-1">Axes d'amélioration</h5>
                        <p className="text-sm text-orange-700">{report.evaluation.improvements}</p>
                      </div>
                    )}
                  </div>
                  
                  {report.evaluation.global_feedback && (
                    <div className="bg-blue-50 p-3 rounded print:bg-white print:border print:border-blue-200">
                      <h5 className="text-sm font-medium text-blue-800 mb-1">Commentaire général</h5>
                      <p className="text-sm text-blue-700">{report.evaluation.global_feedback}</p>
                    </div>
                  )}
                </div>
              )}

              {!report.submission && (
                <p className="text-gray-500 italic">Aucun projet soumis</p>
              )}
            </div>
          ))}
        </div>

        {/* Footer pour l'impression */}
        <div className="hidden print:block mt-8 pt-4 border-t text-center text-xs text-gray-500">
          Rapport généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
        </div>
      </div>
    </div>
  );
}
