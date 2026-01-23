import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { compareCode, analyzeCodeStructure } from '../lib/codeComparison';
import { RichTextEditor } from './RichTextEditor';
import { ItemDocuments } from './ItemDocuments';
import { FileText, Download, Code, CheckCircle, XCircle, AlertCircle, Copy, ChevronRight, ChevronDown, CheckSquare, Square, FileDown } from 'lucide-react';
import type { Item, Submission } from '../types/database';

interface TpControlRendererProps {
  item: Item;
  submission: Submission | null;
  onSubmissionUpdate?: (submission: Submission | null) => void;
  viewingUserId?: string | null;
}

interface GradingCriteria {
  id: string;
  label: string;
  points: number;
  checked: boolean;
  customScore?: number | null; // Score personnalisé si différent du points par défaut
}

export function TpControlRenderer({ item, submission, onSubmissionUpdate, viewingUserId }: TpControlRendererProps) {
  const { user, profile } = useAuth();
  const [code, setCode] = useState(submission?.answer_text || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparisonResult, setComparisonResult] = useState<{
    similarity: number;
    normalized: { user: string; solution: string };
  } | null>(null);
  const [codeStructure, setCodeStructure] = useState<any>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [logFileContent, setLogFileContent] = useState<string>('');
  const [sources, setSources] = useState<Array<{type: 'file' | 'link', name?: string, content?: string, url?: string, label?: string}>>([]);
  const [gradingCriteria, setGradingCriteria] = useState<GradingCriteria[]>([
    { id: 'file_read', label: 'Fichier lu correctement', points: 2, checked: false },
    { id: 'parsing', label: 'Parsing OK', points: 6, checked: false },
    { id: 'fail_filtered', label: 'FAIL bien filtrés', points: 2, checked: false },
    { id: 'top_ip', label: 'Top IP', points: 2, checked: false },
    { id: 'top_users', label: 'Top users', points: 2, checked: false },
    { id: 'soc_rules', label: 'Règles SOC', points: 4, checked: false },
    { id: 'report_written', label: 'Rapport écrit', points: 2, checked: false },
  ]);
  const [gradingLoading, setGradingLoading] = useState(false);
  const [manualScore, setManualScore] = useState<{ numerator: number; denominator: number } | null>(null);
  const [useManualScore, setUseManualScore] = useState(false);
  const [appreciation, setAppreciation] = useState<string>('');
  const [improvementAreas, setImprovementAreas] = useState<string>('');

  const isSubmitted = submission?.status === 'submitted' || submission?.status === 'graded';
  const solutionCode = (item as any).solution_code || '';
  const isTrainerOrAdmin = profile?.role === 'admin' || profile?.role === 'trainer' || profile?.role === 'instructor';

  useEffect(() => {
    // Charger le contenu du fichier de logs si disponible
    if ((item as any).control_tp_log_file) {
      setLogFileContent((item as any).control_tp_log_file);
    }
    
    // Charger les sources
    if ((item as any).control_tp_sources) {
      try {
        const parsedSources = typeof (item as any).control_tp_sources === 'string' 
          ? JSON.parse((item as any).control_tp_sources)
          : (item as any).control_tp_sources;
        setSources(Array.isArray(parsedSources) ? parsedSources : []);
      } catch (e) {
        console.error('Error parsing sources:', e);
        setSources([]);
      }
    }
  }, [item]);

  // Charger la soumission existante si elle n'est pas fournie
  useEffect(() => {
    if (!submission && user && item.id) {
      const fetchSubmission = async () => {
        try {
          const { data, error } = await supabase
            .from('submissions')
            .select('*')
            .eq('user_id', user.id)
            .eq('item_id', item.id)
            .maybeSingle();

          // Ignorer les erreurs 406 (Not Acceptable) qui peuvent survenir avec RLS
          if (error) {
            // Code PGRST116 = no rows returned (normal si pas de soumission)
            // Code 406 = Not Acceptable (peut être dû à RLS, on ignore)
            if (error.code !== 'PGRST116' && error.code !== '406') {
              console.error('Error fetching submission:', error);
            }
            return;
          }

          if (data && onSubmissionUpdate) {
            onSubmissionUpdate(data);
          }
        } catch (err) {
          console.error('Error fetching submission:', err);
        }
      };

      fetchSubmission();
    }
  }, [submission, user, item.id, onSubmissionUpdate]);

  useEffect(() => {
    // Si une soumission existe avec un résultat de comparaison, l'afficher
    if (submission?.answer_json?.comparisonResult) {
      setComparisonResult(submission.answer_json.comparisonResult);
    }
    if (submission?.answer_json?.codeStructure) {
      setCodeStructure(submission.answer_json.codeStructure);
    }
    // Charger la grille de notation si elle existe
    if (submission?.answer_json?.gradingCriteria) {
      const loadedCriteria = submission.answer_json.gradingCriteria.map((c: any) => ({
        ...c,
        customScore: c.customScore !== undefined ? c.customScore : null
      }));
      setGradingCriteria(loadedCriteria);
    }
    if (submission?.answer_json?.manualScore) {
      setManualScore(submission.answer_json.manualScore);
      setUseManualScore(submission.answer_json.useManualScore || false);
    }
    // Charger l'appréciation et les axes d'amélioration depuis les colonnes dédiées ou answer_json (rétrocompatibilité)
    if (submission?.appreciation) {
      setAppreciation(submission.appreciation);
    } else if (submission?.answer_json?.appreciation) {
      setAppreciation(submission.answer_json.appreciation);
    } else {
      setAppreciation('');
    }
    if (submission?.improvement_areas) {
      setImprovementAreas(submission.improvement_areas);
    } else if (submission?.answer_json?.improvementAreas) {
      setImprovementAreas(submission.answer_json.improvementAreas);
    } else {
      setImprovementAreas('');
    }
  }, [submission]);

  const handleDownloadLogFile = () => {
    if (!logFileContent) return;
    
    const blob = new Blob([logFileContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'auth_soc.log';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadSourceFile = (source: {name?: string, content?: string}) => {
    if (!source.content) return;
    
    const blob = new Blob([source.content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = source.name || 'source.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleCodeSubmit = async () => {
    if (!user?.id || !code.trim()) {
      setError('Veuillez saisir votre code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Comparer le code avec la solution
      let comparison: any = null;
      let structure: any = null;

      if (solutionCode) {
        comparison = compareCode(code, solutionCode);
        structure = analyzeCodeStructure(code);
      }

      // Sauvegarder la soumission
      const submissionData: any = {
        user_id: user.id,
        item_id: item.id,
        answer_text: code,
        answer_json: {
          comparisonResult: comparison,
          codeStructure: structure,
          submittedAt: new Date().toISOString()
        },
        status: 'submitted',
        submitted_at: new Date().toISOString()
      };

      if (submission) {
        // Mettre à jour la soumission existante
        const { data, error: updateError } = await supabase
          .from('submissions')
          .update(submissionData)
          .eq('id', submission.id)
          .select()
          .single();

        if (updateError) throw updateError;
        if (onSubmissionUpdate && data) {
          onSubmissionUpdate(data);
        }
      } else {
        // Créer une nouvelle soumission
        const { data, error: insertError } = await supabase
          .from('submissions')
          .insert(submissionData)
          .select()
          .single();

        if (insertError) throw insertError;
        if (onSubmissionUpdate && data) {
          onSubmissionUpdate(data);
        }
      }

      setComparisonResult(comparison);
      setCodeStructure(structure);
    } catch (err: any) {
      console.error('Error submitting code:', err);
      setError(err.message || 'Erreur lors de la soumission');
    } finally {
      setLoading(false);
    }
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 80) return 'text-green-600 bg-green-50';
    if (similarity >= 60) return 'text-yellow-600 bg-yellow-50';
    if (similarity >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getSimilarityBadge = (similarity: number) => {
    if (similarity >= 90) return 'Excellent';
    if (similarity >= 80) return 'Très bien';
    if (similarity >= 70) return 'Bien';
    if (similarity >= 60) return 'Correct';
    if (similarity >= 50) return 'À améliorer';
    return 'Insuffisant';
  };

  const calculateTotalPoints = () => {
    if (useManualScore && manualScore) {
      return manualScore.numerator;
    }
    return gradingCriteria
      .filter(criterion => criterion.checked)
      .reduce((total, criterion) => {
        // Utiliser le score personnalisé s'il existe, sinon le score par défaut
        const score = criterion.customScore !== null && criterion.customScore !== undefined 
          ? criterion.customScore 
          : criterion.points;
        return total + score;
      }, 0);
  };

  const getMaxPoints = () => {
    if (useManualScore && manualScore) {
      return manualScore.denominator;
    }
    return 20;
  };

  const handleCriterionToggle = async (criterionId: string) => {
    if (!isTrainerOrAdmin || !submission) return;

    const updatedCriteria = gradingCriteria.map(criterion =>
      criterion.id === criterionId
        ? { ...criterion, checked: !criterion.checked }
        : criterion
    );

    setGradingCriteria(updatedCriteria);
    await handleCriteriaUpdate(updatedCriteria);
  };

  const handleCriteriaUpdate = async (updatedCriteria: GradingCriteria[]) => {
    if (!isTrainerOrAdmin || !submission) return;

    setGradingLoading(true);
    try {
      const totalPoints = updatedCriteria
        .filter(c => c.checked)
        .reduce((total, c) => {
          const score = c.customScore !== null && c.customScore !== undefined 
            ? c.customScore 
            : c.points;
          return total + score;
        }, 0);

      const finalScore = useManualScore && manualScore ? manualScore.numerator : totalPoints;
      const updatedAnswerJson = {
        ...(submission.answer_json || {}),
        gradingCriteria: updatedCriteria,
        manualGrade: finalScore,
        manualScore: useManualScore && manualScore ? manualScore : null,
        useManualScore,
      };

      const { data, error } = await supabase
        .from('submissions')
        .update({
          answer_json: updatedAnswerJson,
          grade: finalScore,
          status: 'graded',
          graded_at: new Date().toISOString(),
          appreciation: appreciation || null,
          improvement_areas: improvementAreas || null,
        })
        .eq('id', submission.id)
        .select()
        .single();

      if (error) throw error;

      if (onSubmissionUpdate && data) {
        onSubmissionUpdate(data);
      }
    } catch (err: any) {
      console.error('Error saving grading:', err);
      setError('Erreur lors de la sauvegarde de la notation');
      // Restaurer l'état précédent en cas d'erreur
      setGradingCriteria(gradingCriteria);
    } finally {
      setGradingLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!submission || !viewingUserId) return;

    try {
      // Récupérer les informations de l'étudiant
      const { data: studentProfile } = await supabase
        .from('profiles')
        .select('full_name, student_id')
        .eq('id', viewingUserId)
        .single();

      const studentName = studentProfile?.full_name || studentProfile?.student_id || 'Étudiant';

      // Générer le HTML pour le PDF
      const html = generatePdfHtml(item, submission, studentName, code, solutionCode, gradingCriteria, manualScore, useManualScore, appreciation, improvementAreas);

      // Créer un blob et télécharger
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${item.title}_${studentName.replace(/[^a-z0-9]/gi, '_')}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Pour un vrai PDF, on pourrait utiliser jsPDF ou appeler une API backend
      // Pour l'instant, on génère un HTML que l'utilisateur peut imprimer en PDF
      alert('Fichier HTML généré. Ouvrez-le et utilisez "Imprimer > Enregistrer en PDF" pour créer le PDF.');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Erreur lors de l\'export. Vérifiez la console pour plus de détails.');
    }
  };

  const convertTipTapToHtml = (content: any): string => {
    if (!content || typeof content !== 'object') return '';
    if (typeof content === 'string') return content;
    
    let html = '';
    
    const processNode = (node: any): string => {
      if (!node || typeof node !== 'object') return '';
      
      if (node.type === 'paragraph') {
        let text = '';
        if (node.content && Array.isArray(node.content)) {
          text = node.content.map((child: any) => {
            if (child.type === 'text') {
              let result = child.text || '';
              if (child.marks) {
                child.marks.forEach((mark: any) => {
                  if (mark.type === 'bold' || mark.type === 'strong') {
                    result = `<strong>${result}</strong>`;
                  } else if (mark.type === 'italic' || mark.type === 'em') {
                    result = `<em>${result}</em>`;
                  } else if (mark.type === 'underline') {
                    result = `<u>${result}</u>`;
                  } else if (mark.type === 'link') {
                    result = `<a href="${mark.attrs?.href || '#'}">${result}</a>`;
                  }
                });
              }
              return result;
            } else if (child.type === 'hardBreak') {
              return '<br/>';
            } else if (child.content) {
              return processNode(child);
            }
            return '';
          }).join('');
        }
        return `<p>${text || '<br/>'}</p>`;
      } else if (node.type === 'heading') {
        const level = node.attrs?.level || 1;
        let text = '';
        if (node.content && Array.isArray(node.content)) {
          text = node.content.map((child: any) => {
            if (child.type === 'text') return child.text || '';
            return '';
          }).join('');
        }
        return `<h${level}>${text}</h${level}>`;
      } else if (node.type === 'bulletList' || node.type === 'orderedList') {
        const tag = node.type === 'orderedList' ? 'ol' : 'ul';
        let items = '';
        if (node.content && Array.isArray(node.content)) {
          items = node.content.map((item: any) => {
            if (item.type === 'listItem' && item.content) {
              const itemContent = item.content.map(processNode).join('');
              return `<li>${itemContent}</li>`;
            }
            return '';
          }).join('');
        }
        return `<${tag}>${items}</${tag}>`;
      } else if (node.content && Array.isArray(node.content)) {
        return node.content.map(processNode).join('');
      }
      
      return '';
    };
    
    if (content.content && Array.isArray(content.content)) {
      html = content.content.map(processNode).join('');
    } else {
      html = processNode(content);
    }
    
    return html || 'Aucune instruction disponible';
  };

  const generatePdfHtml = (
    item: Item,
    submission: Submission,
    studentName: string,
    studentCode: string,
    solutionCode: string,
    criteria: GradingCriteria[],
    manualScore: { numerator: number; denominator: number } | null,
    useManual: boolean,
    appreciation: string = '',
    improvementAreas: string = ''
  ): string => {
    const totalPoints = useManual && manualScore ? manualScore.numerator : criteria.filter(c => c.checked).reduce((sum, c) => sum + c.points, 0);
    const maxPoints = useManual && manualScore ? manualScore.denominator : 20;
    const instructions = item.content?.instructions ? convertTipTapToHtml(item.content.instructions) : 'Aucune instruction disponible';

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${item.title} - ${studentName}</title>
  <style>
    @page {
      margin: 2cm;
      size: A4;
    }
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 100%;
      margin: 0;
      padding: 20px;
    }
    h1 {
      color: #2c3e50;
      border-bottom: 3px solid #3498db;
      padding-bottom: 10px;
      page-break-after: avoid;
    }
    h2 {
      color: #34495e;
      border-bottom: 2px solid #95a5a6;
      padding-bottom: 8px;
      margin-top: 25px;
      page-break-after: avoid;
    }
    .section {
      page-break-inside: avoid;
      margin-bottom: 30px;
    }
    .page-break {
      page-break-before: always;
    }
    pre {
      background-color: #f4f4f4;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
      page-break-inside: avoid;
      font-size: 0.9em;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #3498db;
      color: white;
    }
    .criteria-checked {
      color: #27ae60;
    }
    .criteria-unchecked {
      color: #e74c3c;
    }
    .score {
      font-size: 1.5em;
      font-weight: bold;
      color: #2c3e50;
      text-align: center;
      padding: 20px;
      background-color: #ecf0f1;
      border-radius: 5px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${item.title}</h1>
    <p><strong>Étudiant:</strong> ${studentName}</p>
    <p><strong>Date de soumission:</strong> ${new Date(submission.submitted_at).toLocaleDateString('fr-FR')}</p>
  </div>

  <div class="page-break"></div>

  <div class="section">
    <h2>1. Énoncé du TP</h2>
    <div>${instructions}</div>
  </div>

  <div class="page-break"></div>

  <div class="section">
    <h2>2. Rendu de l'étudiant</h2>
    <pre><code>${studentCode || 'Aucun code soumis'}</code></pre>
  </div>

  <div class="page-break"></div>

  <div class="section">
    <h2>3. Correction</h2>
    <pre><code>${solutionCode || 'Solution non disponible'}</code></pre>
  </div>

  <div class="page-break"></div>

  <div class="section">
    <h2>4. Notation</h2>
    <table>
      <thead>
        <tr>
          <th>Critère</th>
          <th>Points</th>
          <th>Statut</th>
        </tr>
      </thead>
      <tbody>
        ${criteria.map(c => `
          <tr>
            <td>${c.label}</td>
            <td>${c.points}</td>
            <td class="${c.checked ? 'criteria-checked' : 'criteria-unchecked'}">
              ${c.checked ? '✓ Validé' : '✗ Non validé'}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div class="score">
      Note: ${totalPoints} / ${maxPoints}
    </div>
  </div>

  ${appreciation || improvementAreas ? `
  <div class="page-break"></div>

  <div class="section">
    <h2>5. Appréciation et axes d'amélioration</h2>
    ${appreciation ? `
    <div style="margin-bottom: 20px;">
      <h3 style="color: #27ae60; margin-bottom: 10px;">Appréciation</h3>
      <div style="background-color: #d5f4e6; padding: 15px; border-radius: 5px; border-left: 4px solid #27ae60;">
        <p style="white-space: pre-wrap; margin: 0;">${appreciation}</p>
      </div>
    </div>
    ` : ''}
    ${improvementAreas ? `
    <div>
      <h3 style="color: #e67e22; margin-bottom: 10px;">Axes d'amélioration</h3>
      <div style="background-color: #fdebd0; padding: 15px; border-radius: 5px; border-left: 4px solid #e67e22;">
        <p style="white-space: pre-wrap; margin: 0;">${improvementAreas}</p>
      </div>
    </div>
    ` : ''}
  </div>
  ` : ''}
</body>
</html>`;
  };

  return (
    <div className="space-y-6">
      {/* Instructions du TP - EN PREMIER */}
      {item.content?.instructions && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-medium text-purple-900 mb-2">Consignes du TP</h3>
          {typeof item.content.instructions === 'object' ? (
            <div className="prose max-w-none text-purple-800">
              <RichTextEditor
                content={item.content.instructions}
                onChange={() => {}}
                editable={false}
              />
            </div>
          ) : (
            <div className="text-purple-800 whitespace-pre-wrap">{item.content.instructions}</div>
          )}
        </div>
      )}

      {/* Documents attachés à l'item */}
      <ItemDocuments itemId={item.id} />

      {/* Fichier de logs à fournir */}
      {logFileContent && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-blue-900 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Fichier de logs à fournir
            </h3>
            <button
              onClick={handleDownloadLogFile}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              <Download className="w-4 h-4" />
              Télécharger auth_soc.log
            </button>
          </div>
          <div className="bg-white rounded border border-blue-300 p-3 max-h-64 overflow-auto">
            <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap">
              {logFileContent}
            </pre>
          </div>
          <p className="text-sm text-blue-700 mt-2">
            Créez un fichier <code className="bg-blue-100 px-1 rounded">auth_soc.log</code> avec ce contenu
          </p>
        </div>
      )}

      {/* Sources à fournir */}
      {sources.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-medium text-green-900 flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5" />
            Sources à utiliser
          </h3>
          <div className="space-y-2">
            {sources.map((source, index) => (
              <div key={index} className="bg-white rounded border border-green-300 p-3">
                {source.type === 'file' ? (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{source.name || 'Fichier source'}</p>
                      {source.content && (
                        <details className="mt-2">
                          <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                            Aperçu du contenu
                          </summary>
                          <pre className="mt-2 text-xs font-mono text-gray-800 bg-gray-50 p-2 rounded max-h-48 overflow-auto whitespace-pre-wrap">
                            {source.content}
                          </pre>
                        </details>
                      )}
                    </div>
                    {source.content && (
                      <button
                        onClick={() => handleDownloadSourceFile(source)}
                        className="ml-4 flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      >
                        <Download className="w-4 h-4" />
                        Télécharger
                      </button>
                    )}
                  </div>
                ) : source.type === 'link' ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{source.label || 'Lien externe'}</p>
                      {source.url && (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          {source.url}
                        </a>
                      )}
                    </div>
                    {source.url && (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-4 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      >
                        Ouvrir
                      </a>
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Éditeur de code */}
      <div className="bg-white border border-gray-300 rounded-lg">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <Code className="w-5 h-5" />
            Votre code Python
          </h3>
          {isSubmitted && comparisonResult && (
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getSimilarityColor(comparisonResult.similarity)}`}>
              {comparisonResult.similarity}% - {getSimilarityBadge(comparisonResult.similarity)}
            </div>
          )}
        </div>
        <div className="p-4">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={isSubmitted}
            className="w-full h-96 font-mono text-sm border border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="# Écrivez votre code Python ici..."
            spellCheck={false}
          />
          {!isSubmitted && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Votre code sera comparé automatiquement avec la solution
              </p>
              <button
                onClick={handleCodeSubmit}
                disabled={loading || !code.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Soumission...' : 'Soumettre le code'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Affichage de l'appréciation et axes d'amélioration pour les étudiants */}
      {isSubmitted && submission?.status === 'graded' && !isTrainerOrAdmin && (
        <div className="bg-white border border-gray-300 rounded-lg p-6 space-y-4">
          {submission.grade !== null && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-green-900">Note finale</span>
                <span className="text-2xl font-bold text-green-700">
                  {submission.grade} / {getMaxPoints()}
                </span>
              </div>
            </div>
          )}
          
          {(submission.appreciation || submission.answer_json?.appreciation) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                Appréciation
              </h4>
              <p className="text-blue-800 whitespace-pre-wrap">{submission.appreciation || submission.answer_json?.appreciation}</p>
            </div>
          )}
          
          {(submission.improvement_areas || submission.answer_json?.improvementAreas) && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                Axes d'amélioration
              </h4>
              <p className="text-orange-800 whitespace-pre-wrap">{submission.improvement_areas || submission.answer_json?.improvementAreas}</p>
            </div>
          )}

          {/* Bouton d'export PDF pour les étudiants */}
          {submission && user && submission.status === 'graded' && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={async () => {
                  try {
                    // Récupérer les informations de l'étudiant
                    const studentName = profile?.full_name || profile?.student_id || 'Étudiant';
                    
                    // Récupérer l'appréciation et les axes d'amélioration
                    const currentAppreciation = submission.appreciation || submission.answer_json?.appreciation || '';
                    const currentImprovementAreas = submission.improvement_areas || submission.answer_json?.improvementAreas || '';
                    
                    // Récupérer les critères de notation depuis la soumission (pour les étudiants)
                    const submissionCriteria = submission.answer_json?.gradingCriteria || gradingCriteria;
                    const submissionManualScore = submission.answer_json?.manualScore || manualScore;
                    const submissionUseManual = submission.answer_json?.useManualScore || useManualScore;
                    
                    // Générer le HTML pour le PDF
                    const html = generatePdfHtml(
                      item, 
                      submission, 
                      studentName, 
                      code, 
                      solutionCode, 
                      submissionCriteria, 
                      submissionManualScore, 
                      submissionUseManual, 
                      currentAppreciation, 
                      currentImprovementAreas
                    );

                    // Créer un blob et télécharger
                    const blob = new Blob([html], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${item.title}_${studentName.replace(/[^a-z0-9]/gi, '_')}.html`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);

                    alert('Fichier HTML généré. Ouvrez-le et utilisez "Imprimer > Enregistrer en PDF" pour créer le PDF.');
                  } catch (error) {
                    console.error('Error exporting PDF:', error);
                    alert('Erreur lors de l\'export. Vérifiez la console pour plus de détails.');
                  }
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2"
              >
                <FileDown className="w-4 h-4" />
                Télécharger la correction complète (PDF)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Résultat de la comparaison */}
      {isSubmitted && comparisonResult && (
        <div className="bg-white border border-gray-300 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            Résultat de la correction automatique
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className={`p-4 rounded-lg text-center ${getSimilarityColor(comparisonResult.similarity)}`}>
              <div className="text-3xl font-bold mb-1">{comparisonResult.similarity}%</div>
              <div className="text-sm font-medium">{getSimilarityBadge(comparisonResult.similarity)}</div>
            </div>
            {codeStructure && (
              <>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-gray-700 mb-1">{codeStructure.functionCount}</div>
                  <div className="text-sm text-gray-600">Fonction{codeStructure.functionCount > 1 ? 's' : ''}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-gray-700 mb-1">{codeStructure.lineCount}</div>
                  <div className="text-sm text-gray-600">Ligne{codeStructure.lineCount > 1 ? 's' : ''}</div>
                </div>
              </>
            )}
          </div>

          {/* Analyse structurelle */}
          {codeStructure && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Analyse structurelle</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center gap-2">
                  {codeStructure.hasImports ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className="text-sm">Imports</span>
                </div>
                <div className="flex items-center gap-2">
                  {codeStructure.hasFunctions ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className="text-sm">Fonctions</span>
                </div>
                <div className="flex items-center gap-2">
                  {codeStructure.hasMainBlock ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className="text-sm">Bloc main</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{codeStructure.lineCount} lignes</span>
                </div>
              </div>
            </div>
          )}

          {/* Bouton pour voir la solution */}
          {solutionCode && (
            <div className="border-t border-gray-200 pt-4">
              <button
                onClick={() => setShowSolution(!showSolution)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                {showSolution ? 'Masquer' : 'Voir'} la solution
                {showSolution ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              {showSolution && (
                <div className="mt-3 bg-gray-50 rounded-lg p-4 border border-gray-300">
                  <h4 className="font-medium text-gray-900 mb-2">Solution attendue :</h4>
                  <pre className="text-sm font-mono text-gray-800 overflow-auto max-h-96">
                    {solutionCode}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Grille de notation (visible pour formateurs/admins uniquement) */}
      {isTrainerOrAdmin && isSubmitted && submission && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="mb-4">
            <h3 className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
              <CheckSquare className="w-5 h-5" />
              Grille de notation manuelle
            </h3>
            {viewingUserId && viewingUserId !== user?.id && (
              <p className="text-sm text-yellow-700 italic">
                Vous visualisez la soumission d'un étudiant. Cochez les critères validés pour noter.
              </p>
            )}
          </div>
          <div className="space-y-3">
            {gradingCriteria.map((criterion) => (
              <div
                key={criterion.id}
                className="p-3 bg-white rounded-lg border border-yellow-300 hover:bg-yellow-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-3 flex-1 cursor-pointer">
                    {criterion.checked ? (
                      <CheckSquare className="w-5 h-5 text-green-600" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                    <span className="text-gray-900">{criterion.label}</span>
                    <input
                      type="checkbox"
                      checked={criterion.checked}
                      onChange={() => handleCriterionToggle(criterion.id)}
                      disabled={gradingLoading}
                      className="sr-only"
                    />
                  </label>
                  <div className="flex items-center gap-2">
                    {criterion.checked ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max={criterion.points * 2}
                          step="0.5"
                          value={criterion.customScore !== null && criterion.customScore !== undefined ? criterion.customScore : criterion.points}
                          onChange={(e) => {
                            const newScore = parseFloat(e.target.value) || 0;
                            const updatedCriteria = gradingCriteria.map(c =>
                              c.id === criterion.id
                                ? { ...c, customScore: newScore !== c.points ? newScore : null }
                                : c
                            );
                            setGradingCriteria(updatedCriteria);
                            // Sauvegarder automatiquement après un court délai
                            setTimeout(() => handleCriteriaUpdate(updatedCriteria), 500);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onFocus={(e) => e.stopPropagation()}
                          className="w-16 px-2 py-1 border border-yellow-400 rounded text-sm text-center focus:ring-2 focus:ring-yellow-500"
                        />
                        <span className="text-xs text-gray-500">/ {criterion.points}</span>
                      </div>
                    ) : (
                      <span className="text-sm font-medium text-yellow-700">
                        {criterion.points} point{criterion.points > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div className="mt-4 pt-4 border-t border-yellow-300 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-yellow-900">Total</span>
                <span className="text-2xl font-bold text-yellow-700">
                  {calculateTotalPoints()} / {getMaxPoints()}
                </span>
              </div>
              
              {/* Option pour saisie manuelle du score */}
              <div className="flex items-center gap-3 pt-2 border-t border-yellow-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useManualScore}
                    onChange={(e) => {
                      setUseManualScore(e.target.checked);
                      if (!e.target.checked) {
                        setManualScore(null);
                      } else if (!manualScore) {
                        setManualScore({ numerator: calculateTotalPoints(), denominator: 20 });
                      }
                    }}
                    className="w-4 h-4 text-yellow-600"
                  />
                  <span className="text-sm text-yellow-900">Saisie manuelle du score</span>
                </label>
                {useManualScore && (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max={manualScore?.denominator || 20}
                      value={manualScore?.numerator || 0}
                      onChange={(e) => {
                        const num = parseInt(e.target.value) || 0;
                        setManualScore({ 
                          numerator: num, 
                          denominator: manualScore?.denominator || 20 
                        });
                      }}
                      onBlur={async () => {
                        // Sauvegarder le score manuel
                        if (submission && useManualScore && manualScore) {
                          setGradingLoading(true);
                          try {
                            const updatedAnswerJson = {
                              ...(submission.answer_json || {}),
                              gradingCriteria,
                              manualGrade: manualScore.numerator,
                              manualScore,
                              useManualScore: true,
                              appreciation: appreciation || null,
                              improvementAreas: improvementAreas || null,
                            };
                            const { error } = await supabase
                              .from('submissions')
                              .update({
                                answer_json: updatedAnswerJson,
                                grade: manualScore.numerator,
                                status: 'graded',
                                graded_at: new Date().toISOString(),
                                appreciation: appreciation || null,
                                improvement_areas: improvementAreas || null,
                              })
                              .eq('id', submission.id);
                            if (error) throw error;
                            if (onSubmissionUpdate && submission) {
                              onSubmissionUpdate({ ...submission, answer_json: updatedAnswerJson, grade: manualScore.numerator });
                            }
                          } catch (err) {
                            console.error('Error saving manual score:', err);
                            setError('Erreur lors de la sauvegarde du score manuel');
                          } finally {
                            setGradingLoading(false);
                          }
                        }
                      }}
                      className="w-16 px-2 py-1 border border-yellow-300 rounded text-sm"
                    />
                    <span className="text-yellow-900">/</span>
                    <input
                      type="number"
                      min="1"
                      value={manualScore?.denominator || 20}
                      onChange={(e) => {
                        const den = parseInt(e.target.value) || 20;
                        setManualScore({ 
                          numerator: manualScore?.numerator || 0, 
                          denominator: den 
                        });
                      }}
                      onBlur={async () => {
                        // Sauvegarder le score manuel
                        if (submission && useManualScore && manualScore) {
                          setGradingLoading(true);
                          try {
                            const updatedAnswerJson = {
                              ...(submission.answer_json || {}),
                              gradingCriteria,
                              manualGrade: manualScore.numerator,
                              manualScore,
                              useManualScore: true,
                              appreciation: appreciation || null,
                              improvementAreas: improvementAreas || null,
                            };
                            const { error } = await supabase
                              .from('submissions')
                              .update({
                                answer_json: updatedAnswerJson,
                                grade: manualScore.numerator,
                                status: 'graded',
                                graded_at: new Date().toISOString(),
                                appreciation: appreciation || null,
                                improvement_areas: improvementAreas || null,
                              })
                              .eq('id', submission.id);
                            if (error) throw error;
                            if (onSubmissionUpdate && submission) {
                              onSubmissionUpdate({ ...submission, answer_json: updatedAnswerJson, grade: manualScore.numerator });
                            }
                          } catch (err) {
                            console.error('Error saving manual score:', err);
                            setError('Erreur lors de la sauvegarde du score manuel');
                          } finally {
                            setGradingLoading(false);
                          }
                        }
                      }}
                      className="w-16 px-2 py-1 border border-yellow-300 rounded text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
            {gradingLoading && (
              <p className="text-sm text-yellow-700 italic">Sauvegarde en cours...</p>
            )}
            
            {/* Affichage de la note finale */}
            {submission?.status === 'graded' && submission?.grade !== null && (
              <div className="mt-4 pt-4 border-t border-yellow-300">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-green-900">Note finale</span>
                    <span className="text-2xl font-bold text-green-700">
                      {submission.grade} / {getMaxPoints()}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Appréciation et axes d'amélioration */}
            <div className="mt-6 pt-4 border-t border-yellow-300 space-y-4">
              <div>
                <label className="block text-sm font-medium text-yellow-900 mb-2">
                  Appréciation
                </label>
                <textarea
                  value={appreciation}
                  onChange={async (e) => {
                    setAppreciation(e.target.value);
                    // Sauvegarder automatiquement après un délai
                    if (submission) {
                      const value = e.target.value;
                      setTimeout(async () => {
                        try {
                          await supabase
                            .from('submissions')
                            .update({ appreciation: value || null })
                            .eq('id', submission.id);
                        } catch (err) {
                          console.error('Error saving appreciation:', err);
                        }
                      }, 1000);
                    }
                  }}
                  rows={4}
                  className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                  placeholder="Écrivez votre appréciation générale du travail de l'étudiant..."
                />
                <p className="text-xs text-yellow-600 mt-1">
                  Commentaire positif sur les points forts du travail
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-yellow-900 mb-2">
                  Axes d'amélioration
                </label>
                <textarea
                  value={improvementAreas}
                  onChange={async (e) => {
                    setImprovementAreas(e.target.value);
                    // Sauvegarder automatiquement après un délai
                    if (submission) {
                      const value = e.target.value;
                      setTimeout(async () => {
                        try {
                          await supabase
                            .from('submissions')
                            .update({ improvement_areas: value || null })
                            .eq('id', submission.id);
                        } catch (err) {
                          console.error('Error saving improvement areas:', err);
                        }
                      }, 1000);
                    }
                  }}
                  rows={4}
                  className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                  placeholder="Indiquez les points à améliorer pour progresser..."
                />
                <p className="text-xs text-yellow-600 mt-1">
                  Suggestions constructives pour aider l'étudiant à progresser
                </p>
              </div>
            </div>
            
            {/* Bouton d'export PDF */}
            {submission && viewingUserId && viewingUserId !== user?.id && (
              <div className="mt-4 pt-4 border-t border-yellow-300">
                <button
                  onClick={() => handleExportPdf()}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2"
                >
                  <FileDown className="w-4 h-4" />
                  Exporter le PDF (énoncé, rendu, correction, notation)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          {error}
        </div>
      )}
    </div>
  );
}
