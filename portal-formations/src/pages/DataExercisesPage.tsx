import React, { useEffect, useMemo, useState } from 'react';
import { Download, RotateCcw, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { exercisesData } from '../data/exercises-donnees-massives';

type Exercise = {
  id: string;
  title: string;
  objective: string;
  learnerPrompt: string;
  tasks: string[];
  solution: {
    expected: string[];
    table?: { headers: string[]; rows: string[][] };
    keyMessage: string;
  };
};

type AnswerState = {
  mode: 'apprenant' | 'formateur';
  showAllSolutions: boolean;
  expanded: Record<string, boolean>;
  showSolution: Record<string, boolean>;
  answers: Record<string, string>;
};

const STORAGE_KEY = 'data-course-exercises-v1';

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const EXERCISES: Exercise[] = exercisesData.exercises;

const defaultState: AnswerState = {
  mode: 'apprenant',
  showAllSolutions: false,
  expanded: { ex1: true },
  showSolution: {},
  answers: {},
};

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="text-left p-3 border-b border-gray-200 bg-gray-50 whitespace-nowrap font-semibold"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx} className="border-b border-gray-100">
              {r.map((cell, j) => (
                <td key={j} className="p-3 align-top text-gray-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DataExercisesPage() {
  const [state, setState] = useState<AnswerState>(() =>
    safeJsonParse<AnswerState>(localStorage.getItem(STORAGE_KEY), defaultState)
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const isTrainer = state.mode === 'formateur';

  const visibleSolutions = useMemo(() => {
    return {
      global: isTrainer && state.showAllSolutions,
      perEx: (id: string) => isTrainer && (state.showAllSolutions || !!state.showSolution[id]),
    };
  }, [isTrainer, state.showAllSolutions, state.showSolution]);

  const setExpanded = (id: string, value: boolean) =>
    setState((s) => ({ ...s, expanded: { ...s.expanded, [id]: value } }));

  const toggleExpanded = (id: string) => setExpanded(id, !(state.expanded[id] ?? false));

  const toggleSolution = (id: string) =>
    setState((s) => ({ ...s, showSolution: { ...s.showSolution, [id]: !s.showSolution[id] } }));

  const setAnswer = (id: string, value: string) =>
    setState((s) => ({ ...s, answers: { ...s.answers, [id]: value } }));

  const resetAll = () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser toutes les réponses ?')) {
      setState(defaultState);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const exportAll = () => {
    downloadJson('reponses-exercices-data.json', {
      exportedAt: new Date().toISOString(),
      mode: state.mode,
      answers: state.answers,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-5">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {exercisesData.title}
            </h1>
            <p className="text-gray-600 text-sm">
              {exercisesData.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <span className="px-3 py-1 rounded-full border border-gray-300 text-xs font-medium bg-white">
              Mode
            </span>
            <select
              value={state.mode}
              onChange={(e) => setState((s) => ({ ...s, mode: e.target.value as AnswerState['mode'] }))}
              className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="apprenant">Apprenant</option>
              <option value="formateur">Formateur</option>
            </select>

            <button
              onClick={() => setState((s) => ({ ...s, showAllSolutions: !s.showAllSolutions }))}
              disabled={!isTrainer}
              className={`px-3 py-2 rounded-lg border border-gray-300 text-sm flex items-center gap-2 ${
                isTrainer
                  ? 'bg-white hover:bg-gray-50 cursor-pointer'
                  : 'bg-gray-100 cursor-not-allowed opacity-50'
              }`}
              title={
                isTrainer
                  ? 'Afficher/Masquer toutes les solutions'
                  : 'Passe en mode Formateur pour voir les solutions'
              }
            >
              {state.showAllSolutions ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  Masquer solutions
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Afficher solutions
                </>
              )}
            </button>

            <button
              onClick={exportAll}
              className="px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exporter JSON
            </button>

            <button
              onClick={resetAll}
              className="px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Réinitialiser
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {EXERCISES.map((ex) => {
            const expanded = state.expanded[ex.id] ?? false;
            const canShowSolution = visibleSolutions.perEx(ex.id);

            return (
              <div key={ex.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      onClick={() => toggleExpanded(ex.id)}
                      className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm font-medium min-w-[40px]"
                    >
                      {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <h2 className="text-lg font-semibold text-gray-900">{ex.title}</h2>
                    <span className="px-2.5 py-1 rounded-full border border-gray-300 text-xs font-medium bg-gray-50">
                      {ex.id.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleSolution(ex.id)}
                      disabled={!isTrainer}
                      className={`px-3 py-1.5 rounded-lg border border-gray-300 text-sm flex items-center gap-2 ${
                        isTrainer
                          ? 'bg-white hover:bg-gray-50 cursor-pointer'
                          : 'bg-gray-100 cursor-not-allowed opacity-50'
                      }`}
                      title={isTrainer ? 'Afficher/Masquer la solution de cet exercice' : 'Mode formateur requis'}
                    >
                      {state.showSolution[ex.id] ? (
                        <>
                          <EyeOff className="w-4 h-4" />
                          Masquer
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          Afficher
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {expanded && (
                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2.5 py-1 rounded-full border border-gray-300 text-xs font-medium bg-blue-50 text-blue-700">
                          Objectif
                        </span>
                        <div className="text-gray-700 text-sm">{ex.objective}</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                      <div className="font-semibold text-gray-900 mb-2">Consigne</div>
                      <div className="text-gray-700 whitespace-pre-wrap text-sm">{ex.learnerPrompt}</div>
                    </div>

                    <div>
                      <div className="font-semibold text-gray-900 mb-2">Travail demandé</div>
                      <ol className="list-decimal list-inside space-y-2 text-gray-700 text-sm ml-2">
                        {ex.tasks.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ol>
                    </div>

                    <div>
                      <div className="font-semibold text-gray-900 mb-2">Réponse(s) du participant</div>
                      <textarea
                        value={state.answers[ex.id] ?? ''}
                        onChange={(e) => setAnswer(ex.id, e.target.value)}
                        placeholder="Saisir ici les réponses / notes de groupe…"
                        className="w-full min-h-[120px] p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y text-sm"
                      />
                      <div className="mt-2 text-gray-500 text-xs">
                        Sauvegarde automatique (localStorage). Export JSON possible via le bouton en haut.
                      </div>
                    </div>

                    {canShowSolution && (
                      <div className="border-t border-gray-200 pt-4 space-y-4">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full border border-gray-300 text-xs font-medium bg-green-50 text-green-700">
                            Solution
                          </span>
                          <div className="text-gray-600 text-xs">
                            (Visible uniquement en <b>mode Formateur</b>)
                          </div>
                        </div>

                        {ex.solution.table && (
                          <div className="mt-3">
                            <Table headers={ex.solution.table.headers} rows={ex.solution.table.rows} />
                          </div>
                        )}

                        <div>
                          <div className="font-semibold text-gray-900 mb-2">Éléments attendus</div>
                          <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm ml-2">
                            {ex.solution.expected.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                          <div className="font-semibold text-gray-900 mb-2">Message clé formateur</div>
                          <div className="text-gray-700 text-sm">{ex.solution.keyMessage}</div>
                        </div>
                      </div>
                    )}

                    {!isTrainer && (
                      <div className="text-gray-500 text-xs">
                        Les solutions sont masquées en mode Apprenant.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center text-gray-500 text-xs">
          Astuce animation : fais travailler en groupes 10–12 min / exercice, puis ouvre le mode Formateur pour le
          débrief.
        </div>
      </div>
    </div>
  );
}
