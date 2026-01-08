import { useMemo } from 'react';
import { Passenger, ModuleAnswers, Answer } from '../types';
import { DataTable } from '../components/DataTable';
import { Filters, FilterState } from '../components/Filters';
import { Questions } from '../components/Questions';
import { BarChart } from '../components/charts/BarChart';
import { Histogram } from '../components/charts/Histogram';
import { useLocalStorage } from '../lib/useLocalStorage';
import './Module.css';

interface DataScienceProps {
  passengers: Passenger[];
}

const QUESTIONS = [
  {
    id: 'q1',
    label: 'Qui survit le plus ?',
    dropdownOptions: ['Femmes', 'Hommes', 'Aucune différence'],
    inputLabel: 'Justification',
    inputType: 'text' as const,
  },
  {
    id: 'q2',
    label: 'La classe influence-t-elle la survie ?',
    dropdownOptions: ['Beaucoup', 'Un peu', 'Pas du tout'],
    inputLabel: 'Justification',
    inputType: 'text' as const,
  },
  {
    id: 'q3',
    label: 'Quel facteur semble le plus fort ?',
    dropdownOptions: ['Sexe', 'Classe', 'Age', 'Prix', 'Embarquement'],
    inputLabel: 'Justification',
    inputType: 'text' as const,
  },
  {
    id: 'q4',
    label: 'Quelle décision humaine proposerais-tu ?',
    dropdownOptions: [
      'Priorité femmes & enfants',
      'Priorité classe 1',
      'Priorité proches canots',
      'Autre',
    ],
    inputLabel: 'Détails (si autre)',
    inputType: 'text' as const,
  },
];

export function DataScience({ passengers }: DataScienceProps) {
  const [answers, setAnswers] = useLocalStorage<ModuleAnswers>('data-science-answers', {});
  const [filters, setFilters] = useLocalStorage<FilterState>('data-science-filters', {
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

  const survivalBySexe = useMemo(() => {
    const female = passengers.filter(p => p.sexe === 'female');
    const male = passengers.filter(p => p.sexe === 'male');
    const femaleSurvival = (female.filter(p => p.survivant === 'oui').length / female.length) * 100;
    const maleSurvival = (male.filter(p => p.survivant === 'oui').length / male.length) * 100;

    return [
      { label: 'Femmes', value: femaleSurvival },
      { label: 'Hommes', value: maleSurvival },
    ];
  }, [passengers]);

  const survivalByClasse = useMemo(() => {
    const classes = [1, 2, 3];
    return classes.map(classe => {
      const classPassengers = passengers.filter(p => p.classe === classe);
      const survival = (classPassengers.filter(p => p.survivant === 'oui').length / classPassengers.length) * 100;
      return { label: `Classe ${classe}`, value: survival };
    });
  }, [passengers]);

  const ageDistribution = useMemo(() => {
    return passengers
      .filter(p => p.age !== null)
      .map(p => p.age as number);
  }, [passengers]);

  const prixBySurvivant = useMemo(() => {
    const survivants = passengers.filter(p => p.survivant === 'oui').map(p => p.prix);
    const nonSurvivants = passengers.filter(p => p.survivant === 'non').map(p => p.prix);
    return { survivants, nonSurvivants };
  }, [passengers]);

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
    link.download = 'data-science-reponses.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const answeredCount = QUESTIONS.filter(q => answers[q.id]).length;

  return (
    <div className="module">
      <div className="module-header">
        <h2>Module 2 : Data Science</h2>
        <p className="module-description">
          Objectif : Extraire du sens avec graphiques simples (sans ML)
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

      <div className="charts-section">
        <h3>Graphiques</h3>
        <BarChart
          data={survivalBySexe}
          title="Taux de survie par Sexe"
          yLabel="Taux de survie (%)"
          xLabel="Sexe"
        />
        <BarChart
          data={survivalByClasse}
          title="Taux de survie par Classe"
          yLabel="Taux de survie (%)"
          xLabel="Classe"
        />
        <Histogram
          data={ageDistribution}
          title="Distribution de l'Âge"
          xLabel="Âge"
          yLabel="Fréquence"
        />
        <div className="summary-box">
          <h4>Résumé Prix par Survivant</h4>
          <div className="summary-content">
            <div>
              <strong>Survivants :</strong> Moyenne = {(prixBySurvivant.survivants.reduce((a, b) => a + b, 0) / prixBySurvivant.survivants.length).toFixed(2)}
            </div>
            <div>
              <strong>Non-survivants :</strong> Moyenne = {(prixBySurvivant.nonSurvivants.reduce((a, b) => a + b, 0) / prixBySurvivant.nonSurvivants.length).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      <Questions questions={QUESTIONS} answers={answers} onAnswer={handleAnswer} />
    </div>
  );
}
