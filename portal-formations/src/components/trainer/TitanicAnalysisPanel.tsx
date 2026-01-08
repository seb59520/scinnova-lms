import { useState } from 'react';
import { Sparkles, Loader, CheckCircle, AlertCircle, FileJson } from 'lucide-react';
import { analyzeTitanicAnswers, analyzeTitanicPredictions, TitanicAnalysisResult } from '../../lib/titanicAnalyzer';
import { Submission } from '../../types/database';
import './TitanicAnalysisPanel.css';

interface TitanicAnalysisPanelProps {
  submission: Submission;
  itemTitle: string;
  questions?: Array<{ id: string; label: string }>;
}

export function TitanicAnalysisPanel({ submission, itemTitle, questions = [] }: TitanicAnalysisPanelProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<TitanicAnalysisResult | null>(
    submission.answer_json?.aiAnalysis || null
  );
  const [error, setError] = useState<string | null>(null);

  const titanicData = submission.answer_json?.titanicData;
  const moduleType = submission.answer_json?.moduleType as 'big-data' | 'data-science' | 'machine-learning';

  if (!titanicData || !moduleType) {
    return null; // Pas de données Titanic à analyser
  }

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError(null);

    try {
      let result: TitanicAnalysisResult;

      if (moduleType === 'machine-learning') {
        // Analyser les prédictions
        const predictions = titanicData.predictions || [];
        const answers = titanicData.answers || {};
        result = await analyzeTitanicPredictions(predictions, answers);
      } else {
        // Analyser les réponses (big-data ou data-science)
        const answersKey = moduleType === 'big-data' ? 'big-data-answers' : 'data-science-answers';
        const answers = titanicData[answersKey] || {};
        result = await analyzeTitanicAnswers(answers, moduleType, questions);
      }

      // Sauvegarder l'analyse dans answer_json
      const updatedAnswerJson = {
        ...submission.answer_json,
        aiAnalysis: result,
        analyzedAt: new Date().toISOString(),
      };

      // Mettre à jour la soumission (nécessite une fonction de callback ou un refresh)
      setAnalysis(result);

      // Optionnel : sauvegarder dans la base de données
      // await supabase.from('submissions').update({ answer_json: updatedAnswerJson }).eq('id', submission.id);
    } catch (err: any) {
      console.error('Erreur lors de l\'analyse:', err);
      setError(err.message || 'Une erreur est survenue lors de l\'analyse');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="titanic-analysis-panel">
      <div className="analysis-header">
        <div className="header-content">
          <FileJson className="header-icon" size={24} />
          <div>
            <h3 className="analysis-title">Analyse IA des réponses Titanic</h3>
            <p className="analysis-subtitle">
              Module: {moduleType} | {submission.answer_json?.uploadedAt 
                ? `Importé le ${new Date(submission.answer_json.uploadedAt).toLocaleDateString('fr-FR')}`
                : 'Données disponibles'}
            </p>
          </div>
        </div>
        {!analysis && (
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="analyze-button"
          >
            {analyzing ? (
              <>
                <Loader className="spinner" size={16} />
                <span>Analyse en cours...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Analyser avec l'IA</span>
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {analysis && (
        <div className="analysis-content">
          {/* Résumé */}
          <div className="analysis-section summary-section">
            <h4 className="section-title">📊 Résumé</h4>
            <p className="summary-text">{analysis.summary}</p>
          </div>

          {/* Score */}
          {analysis.score !== undefined && (
            <div className="analysis-section score-section">
              <h4 className="section-title">Note estimée</h4>
              <div className="score-display">
                <span className="score-value">{analysis.score}</span>
                <span className="score-max">/ 20</span>
              </div>
            </div>
          )}

          {/* Points forts */}
          {analysis.strengths && analysis.strengths.length > 0 && (
            <div className="analysis-section strengths-section">
              <h4 className="section-title">✅ Points forts</h4>
              <ul className="analysis-list">
                {analysis.strengths.map((strength, idx) => (
                  <li key={idx}>
                    <CheckCircle className="list-icon" size={16} />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Points faibles */}
          {analysis.weaknesses && analysis.weaknesses.length > 0 && (
            <div className="analysis-section weaknesses-section">
              <h4 className="section-title">⚠️ Points à améliorer</h4>
              <ul className="analysis-list">
                {analysis.weaknesses.map((weakness, idx) => (
                  <li key={idx}>
                    <AlertCircle className="list-icon" size={16} />
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {analysis.suggestions && analysis.suggestions.length > 0 && (
            <div className="analysis-section suggestions-section">
              <h4 className="section-title">💡 Suggestions</h4>
              <ul className="analysis-list">
                {analysis.suggestions.map((suggestion, idx) => (
                  <li key={idx}>
                    <Sparkles className="list-icon" size={16} />
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Analyse détaillée */}
          {analysis.detailedAnalysis && (
            <div className="analysis-section detailed-section">
              <h4 className="section-title">📝 Analyse détaillée</h4>
              <div className="detailed-text">{analysis.detailedAnalysis}</div>
            </div>
          )}

          {/* Bouton pour ré-analyser */}
          <div className="re-analyze-section">
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="re-analyze-button"
            >
              {analyzing ? (
                <>
                  <Loader className="spinner" size={16} />
                  <span>Ré-analyse en cours...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Ré-analyser</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
