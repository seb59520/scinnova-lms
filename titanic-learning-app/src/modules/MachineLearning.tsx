import { useState, useMemo, useEffect } from 'react';
import { Passenger, ModuleAnswers, Answer, Prediction } from '../types';
import { Questions } from '../components/Questions';
import { useLocalStorage } from '../lib/useLocalStorage';
import './Module.css';

interface MachineLearningProps {
  passengers: Passenger[];
}

const QUESTIONS = [
  {
    id: 'q1',
    label: 'Le modèle comprend-il le contexte humain ?',
    dropdownOptions: ['Oui', 'Non'],
    inputLabel: 'Justification',
    inputType: 'text' as const,
  },
  {
    id: 'q2',
    label: 'Quel risque principal ?',
    dropdownOptions: ['Biais', 'Surconfiance', 'Mauvaise donnée', 'Tous'],
    inputLabel: 'Justification',
    inputType: 'text' as const,
  },
  {
    id: 'q3',
    label: 'Dans quel domaine c\'est dangereux ?',
    dropdownOptions: ['Crédit', 'Recrutement', 'Santé', 'Tous'],
    inputLabel: 'Justification',
    inputType: 'text' as const,
  },
];

const TEST_PASSENGERS_INDICES = [0, 1, 2, 3, 4, 5, 6, 7];

export function MachineLearning({ passengers }: MachineLearningProps) {
  const [answers, setAnswers] = useLocalStorage<ModuleAnswers>('machine-learning-answers', {});
  const [predictions, setPredictions] = useLocalStorage<Prediction[]>('machine-learning-predictions', []);
  const [revealed, setRevealed] = useState(false);

  const testPassengers = useMemo(() => {
    return TEST_PASSENGERS_INDICES.map(index => passengers[index]).filter(Boolean);
  }, [passengers]);

  useEffect(() => {
    if (predictions.length === 0 && testPassengers.length > 0) {
      const initial = testPassengers.map(passenger => ({
        passenger,
        userPrediction: null as 'oui' | 'non' | null,
        justification: '',
        revealed: false,
      }));
      setPredictions(initial);
    }
  }, [predictions.length, testPassengers, setPredictions]);

  const initializedPredictions = predictions.length > 0 ? predictions : testPassengers.map(passenger => ({
    passenger,
    userPrediction: null as 'oui' | 'non' | null,
    justification: '',
    revealed: false,
  }));

  const handlePrediction = (index: number, prediction: 'oui' | 'non', justification: string) => {
    const updated = [...initializedPredictions];
    updated[index] = {
      ...updated[index],
      userPrediction: prediction,
      justification,
    };
    setPredictions(updated);
  };

  const handleReveal = () => {
    const updated = initializedPredictions.map(p => ({ ...p, revealed: true }));
    setPredictions(updated);
    setRevealed(true);
  };

  const score = useMemo(() => {
    if (!revealed) return null;
    const correct = initializedPredictions.filter(
      p => p.revealed && p.userPrediction === p.passenger.survivant
    ).length;
    return (correct / initializedPredictions.length) * 100;
  }, [revealed, initializedPredictions]);

  const biasAlert = useMemo(() => {
    if (!revealed) return null;
    const allMale = initializedPredictions.every(
      p => p.passenger.sexe === 'male' && p.userPrediction === 'non'
    );
    const allFemale = initializedPredictions.every(
      p => p.passenger.sexe === 'female' && p.userPrediction === 'oui'
    );
    if (allMale) return 'Alerte : Vous avez prédit "non" pour tous les hommes. Cela peut indiquer un biais de genre.';
    if (allFemale) return 'Alerte : Vous avez prédit "oui" pour toutes les femmes. Cela peut indiquer un biais de genre.';
    return null;
  }, [revealed, initializedPredictions]);

  const handleAnswer = (questionId: string, dropdownValue: string, inputValue: string) => {
    if (!dropdownValue || !inputValue) return;

    const answer: Answer = {
      questionId,
      dropdownValue,
      inputValue,
      timestamp: Date.now(),
    };

    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleReset = () => {
    setAnswers({});
    setPredictions([]);
    setRevealed(false);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify({ answers, predictions }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'machine-learning-reponses.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const answeredCount = QUESTIONS.filter(q => answers[q.id]).length;
  const allPredicted = initializedPredictions.every(p => p.userPrediction !== null);

  return (
    <div className="module">
      <div className="module-header">
        <h2>Module 3 : Machine Learning</h2>
        <p className="module-description">
          Objectif : Faire "modèle humain" puis comparer avec réalité
        </p>
      </div>

      <div className="module-actions">
        <button onClick={handleReset} className="action-btn reset-btn">
          Réinitialiser
        </button>
        <button onClick={handleExport} className="action-btn export-btn">
          Exporter mes réponses
        </button>
      </div>

      <div className="progress-section">
        <div className="progress-card">
          <strong>Progression :</strong> {answeredCount} / {QUESTIONS.length} questions répondues
        </div>
      </div>

      <div className="predictions-section">
        <h3>Prédictions</h3>
        <p>Prédisez la survie pour chaque passager ci-dessous :</p>

        <div className="predictions-grid">
          {initializedPredictions.map((prediction, index) => (
            <div key={index} className="prediction-card">
              <div className="prediction-header">
                <h4>Passager {index + 1}</h4>
                {prediction.revealed && (
                  <span className={`result-badge ${prediction.passenger.survivant === prediction.userPrediction ? 'correct' : 'incorrect'}`}>
                    {prediction.passenger.survivant === prediction.userPrediction ? '✓ Correct' : '✗ Incorrect'}
                  </span>
                )}
              </div>

              <div className="prediction-info">
                <div><strong>Sexe :</strong> {prediction.passenger.sexe}</div>
                <div><strong>Âge :</strong> {prediction.passenger.age !== null ? prediction.passenger.age : '?'}</div>
                <div><strong>Classe :</strong> {prediction.passenger.classe}</div>
                <div><strong>Prix :</strong> {prediction.passenger.prix.toFixed(2)}</div>
                <div><strong>Embarquement :</strong> {prediction.passenger.embarquement}</div>
              </div>

              {!prediction.revealed ? (
                <div className="prediction-form">
                  <select
                    value={prediction.userPrediction || ''}
                    onChange={(e) => {
                      const value = e.target.value as 'oui' | 'non' | '';
                      if (value) {
                        handlePrediction(index, value, prediction.justification);
                      }
                    }}
                    className="prediction-select"
                  >
                    <option value="">Prédire...</option>
                    <option value="oui">Oui (survivant)</option>
                    <option value="non">Non (non-survivant)</option>
                  </select>

                  <textarea
                    value={prediction.justification}
                    onChange={(e) => {
                      if (prediction.userPrediction) {
                        handlePrediction(index, prediction.userPrediction, e.target.value);
                      }
                    }}
                    placeholder="Pourquoi ?"
                    className="prediction-textarea"
                    rows={2}
                    disabled={!prediction.userPrediction}
                  />
                </div>
              ) : (
                <div className="prediction-result">
                  <div className="result-info">
                    <div><strong>Votre prédiction :</strong> {prediction.userPrediction}</div>
                    <div><strong>Réalité :</strong> {prediction.passenger.survivant}</div>
                  </div>
                  {prediction.justification && (
                    <div className="justification">
                      <strong>Votre justification :</strong> {prediction.justification}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="predictions-actions">
          <button
            onClick={handleReveal}
            disabled={!allPredicted || revealed}
            className="action-btn reveal-btn"
          >
            {revealed ? 'Résultats révélés' : 'Révéler la vérité'}
          </button>

          {revealed && score !== null && (
            <div className="score-display">
              <h4>Score : {score.toFixed(1)}%</h4>
              <p>{initializedPredictions.filter(p => p.passenger.survivant === p.userPrediction).length} / {initializedPredictions.length} prédictions correctes</p>
            </div>
          )}

          {biasAlert && (
            <div className="bias-alert">
              <strong>⚠️ Biais potentiels :</strong> {biasAlert}
            </div>
          )}
        </div>
      </div>

      <Questions questions={QUESTIONS} answers={answers} onAnswer={handleAnswer} />
    </div>
  );
}
