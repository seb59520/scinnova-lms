import { Passenger, ModuleAnswers, Answer } from '../types';
import { DataTable } from '../components/DataTable';
import { Filters, FilterState } from '../components/Filters';
import { Questions } from '../components/Questions';
import { useLocalStorage } from '../lib/useLocalStorage';
import './Module.css';

interface BigDataProps {
  passengers: Passenger[];
}

const QUESTIONS = [
  {
    id: 'q1',
    label: 'Combien de lignes vois-tu ?',
    dropdownOptions: ['Je ne sais pas', '< 10', '10-30', '> 30'],
    inputLabel: 'Nombre exact',
    inputType: 'number' as const,
  },
  {
    id: 'q2',
    label: 'Quelles colonnes sont numériques ?',
    dropdownOptions: ['Age', 'Classe', 'Prix'],
    inputLabel: 'Liste des colonnes',
    inputType: 'text' as const,
  },
  {
    id: 'q3',
    label: 'Y a-t-il des valeurs manquantes ?',
    dropdownOptions: ['Oui', 'Non'],
    inputLabel: 'Où ?',
    inputType: 'text' as const,
  },
  {
    id: 'q4',
    label: 'Une donnée te semble ambiguë ?',
    dropdownOptions: ['Oui', 'Non'],
    inputLabel: 'Laquelle et pourquoi ?',
    inputType: 'text' as const,
  },
];

export function BigData({ passengers }: BigDataProps) {
  const [answers, setAnswers] = useLocalStorage<ModuleAnswers>('big-data-answers', {});
  const [filters, setFilters] = useLocalStorage<FilterState>('big-data-filters', {
    search: '',
    sexe: '',
    classe: '',
    embarquement: '',
    survivant: '',
    ageMin: '',
    ageMax: '',
    prixMin: '',
    prixMax: '',
  });

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
    setFilters({
      search: '',
      sexe: '',
      classe: '',
      embarquement: '',
      survivant: '',
      ageMin: '',
      ageMax: '',
      prixMin: '',
      prixMax: '',
    });
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(answers, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'big-data-reponses.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const answeredCount = QUESTIONS.filter(q => answers[q.id]).length;

  return (
    <div className="module">
      <div className="module-header">
        <h2>Module 1 : Big Data</h2>
        <p className="module-description">
          Objectif : Observer la donnée brute
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

      <Filters passengers={passengers} filters={filters} onFilterChange={setFilters} />
      <DataTable passengers={passengers} filters={filters} />
      <Questions questions={QUESTIONS} answers={answers} onAnswer={handleAnswer} />
    </div>
  );
}
