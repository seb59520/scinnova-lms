import { ModuleAnswers } from '../types';
import './Questions.css';

interface Question {
  id: string;
  label: string;
  dropdownOptions: string[];
  inputLabel: string;
  inputType: 'text' | 'number';
}

interface QuestionsProps {
  questions: Question[];
  answers: ModuleAnswers;
  onAnswer: (questionId: string, dropdownValue: string, inputValue: string) => void;
}

export function Questions({ questions, answers, onAnswer }: QuestionsProps) {
  const answeredCount = questions.filter(q => answers[q.id]).length;

  return (
    <div className="questions-container">
      <div className="questions-header">
        <h2>Questions</h2>
        <div className="progress-badge">
          {answeredCount} / {questions.length} répondues
        </div>
      </div>

      <div className="questions-list">
        {questions.map((question) => {
          const answer = answers[question.id];
          const isAnswered = !!answer;

          return (
            <div key={question.id} className={`question-card ${isAnswered ? 'answered' : ''}`}>
              <div className="question-header">
                <h3>{question.label}</h3>
                {isAnswered && <span className="status-badge">✓ Répondu</span>}
              </div>

              <div className="question-form">
                <div className="form-group">
                  <label>Choix</label>
                  <select
                    value={answer?.dropdownValue || ''}
                    onChange={(e) => {
                      const inputValue = answer?.inputValue || '';
                      onAnswer(question.id, e.target.value, inputValue);
                    }}
                    className="question-select"
                  >
                    <option value="">Sélectionner...</option>
                    {question.dropdownOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>{question.inputLabel}</label>
                  {question.inputType === 'number' ? (
                    <input
                      type="number"
                      value={answer?.inputValue || ''}
                      onChange={(e) => {
                        const dropdownValue = answer?.dropdownValue || '';
                        onAnswer(question.id, dropdownValue, e.target.value);
                      }}
                      className="question-input"
                      placeholder="Saisir une valeur..."
                    />
                  ) : (
                    <textarea
                      value={answer?.inputValue || ''}
                      onChange={(e) => {
                        const dropdownValue = answer?.dropdownValue || '';
                        onAnswer(question.id, dropdownValue, e.target.value);
                      }}
                      className="question-textarea"
                      placeholder="Saisir votre réponse..."
                      rows={3}
                    />
                  )}
                </div>

                <button
                  onClick={() => {
                    const currentAnswer = answers[question.id];
                    if (currentAnswer?.dropdownValue && currentAnswer?.inputValue) {
                      onAnswer(
                        question.id,
                        currentAnswer.dropdownValue,
                        currentAnswer.inputValue
                      );
                    }
                  }}
                  disabled={!answer?.dropdownValue || !answer?.inputValue}
                  className="validate-btn"
                >
                  Valider
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
