import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { Profile } from '../../types/database';
import { Search, BookOpen, TrendingUp, Users, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { TrainerHeader } from '../../components/trainer/TrainerHeader';

interface ExerciseSubmissionRecord {
  id: string;
  user_id: string;
  exercise_id: string;
  exercise_title: string;
  answers: {
    questionId: string;
    answer: string | number | string[] | any;
  }[];
  score: number | null;
  feedback: string | null;
  submitted_at: string;
  updated_at: string;
  profiles?: Profile;
}

export function TrainerDataScienceExercises() {
  const { courseId, sessionId } = useParams<{ courseId?: string; sessionId?: string }>();
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<ExerciseSubmissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, [courseId, sessionId]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      setError('');

      let query = supabase
        .from('data_science_exercises')
        .select(`
          *,
          profiles (
            id,
            full_name,
            role
          )
        `)
        .order('submitted_at', { ascending: false });

      // Filter by enrolled users if courseId or sessionId is present
      if (courseId) {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('user_id')
          .eq('course_id', courseId)
          .eq('status', 'active');

        if (enrollments && enrollments.length > 0) {
          const userIds = enrollments.map(e => e.user_id);
          query = query.in('user_id', userIds);
        }
      } else if (sessionId) {
        const { data: sessionEnrollments } = await supabase
          .from('enrollments')
          .select('user_id')
          .eq('session_id', sessionId)
          .eq('status', 'active');

        if (sessionEnrollments && sessionEnrollments.length > 0) {
          const userIds = sessionEnrollments.map(e => e.user_id);
          query = query.in('user_id', userIds);
        }
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setSubmissions((data || []) as ExerciseSubmissionRecord[]);
    } catch (err: any) {
      console.error('Error fetching exercise submissions:', err);
      setError('Erreur lors du chargement des soumissions.');
    } finally {
      setLoading(false);
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    const userName = submission.profiles?.full_name?.toLowerCase() || '';
    const title = submission.exercise_title.toLowerCase();
    const exerciseId = submission.exercise_id.toLowerCase();

    return (
      userName.includes(searchLower) ||
      title.includes(searchLower) ||
      exerciseId.includes(searchLower)
    );
  });

  const totalSubmissions = submissions.length;
  const uniqueUsers = new Set(submissions.map(s => s.user_id)).size;
  const uniqueExercises = new Set(submissions.map(s => s.exercise_id)).size;
  const avgScore = totalSubmissions > 0
    ? (submissions
        .filter(s => s.score !== null)
        .reduce((sum, s) => sum + (s.score || 0), 0) / 
        submissions.filter(s => s.score !== null).length).toFixed(1)
    : 'N/A';

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-600">Chargement des soumissions...</div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">Erreur: {error}</div>
    );
  }

  return (
    <div className="p-8">
      <TrainerHeader
        title="Exercices Data Science - Soumissions des étudiants"
        subtitle="Consultez les soumissions et résultats des exercices Data Science"
      />

      <div className="mb-6 flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher par étudiant, exercice..."
            className="input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Soumissions</p>
            <p className="text-2xl font-bold text-gray-900">{totalSubmissions}</p>
          </div>
          <BookOpen className="w-8 h-8 text-purple-400" />
        </div>
        <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Étudiants Uniques</p>
            <p className="text-2xl font-bold text-gray-900">{uniqueUsers}</p>
          </div>
          <Users className="w-8 h-8 text-blue-400" />
        </div>
        <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Score Moyen</p>
            <p className="text-2xl font-bold text-gray-900">{avgScore}%</p>
          </div>
          <TrendingUp className="w-8 h-8 text-green-400" />
        </div>
        <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Exercices Uniques</p>
            <p className="text-2xl font-bold text-gray-900">{uniqueExercises}</p>
          </div>
          <CheckCircle className="w-8 h-8 text-orange-400" />
        </div>
      </div>

      {filteredSubmissions.length === 0 ? (
        <div className="text-center text-gray-500 p-8">Aucune soumission trouvée pour votre recherche.</div>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((submission) => (
            <div key={submission.id} className="bg-white rounded-lg shadow-md p-6">
              <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() => setExpandedSubmission(expandedSubmission === submission.id ? null : submission.id)}
              >
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {submission.exercise_title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Par: {submission.profiles?.full_name || 'Utilisateur temporaire'} 
                    {' • '}
                    Exercice: {submission.exercise_id}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Soumis le: {new Date(submission.submitted_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  {submission.score !== null && (
                    <span className={`text-lg font-bold ${
                      submission.score >= 80 ? 'text-green-600' :
                      submission.score >= 60 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      Score: {submission.score}%
                    </span>
                  )}
                  {expandedSubmission === submission.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </div>

              {expandedSubmission === submission.id && (
                <div className="mt-6 border-t border-gray-200 pt-6 space-y-4">
                  {/* Score et feedback */}
                  {submission.score !== null && (
                    <div className={`p-4 rounded-lg ${
                      submission.score >= 80 ? 'bg-green-50 border border-green-200' :
                      submission.score >= 60 ? 'bg-yellow-50 border border-yellow-200' :
                      'bg-red-50 border border-red-200'
                    }`}>
                      <h4 className="font-semibold text-gray-900 mb-2">📊 Résultat</h4>
                      <p className="text-lg font-bold mb-1">Score: {submission.score}%</p>
                      {submission.feedback && (
                        <p className="text-sm text-gray-700">{submission.feedback}</p>
                      )}
                    </div>
                  )}

                  {/* Réponses */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">📝 Réponses de l'étudiant</h4>
                    <div className="space-y-3">
                      {submission.answers.map((answer, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Question {index + 1} (ID: {answer.questionId})
                          </p>
                          <div className="bg-white p-3 rounded border border-gray-200">
                            {typeof answer.answer === 'object' ? (
                              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                                {JSON.stringify(answer.answer, null, 2)}
                              </pre>
                            ) : (
                              <p className="text-sm text-gray-700">{String(answer.answer)}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

