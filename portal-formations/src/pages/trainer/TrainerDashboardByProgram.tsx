import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTrainerDashboard } from '../../hooks/useTrainerDashboard';
import { StudentProgressTable } from '../../components/trainer/StudentProgressTable';
import { TrainerHeader } from '../../components/trainer/TrainerHeader';
import {
  Building2,
  Users,
  TrendingUp,
  BookOpen,
  ChevronDown,
  ClipboardCheck,
  Award,
  FileText,
  ChevronRight
} from 'lucide-react';

export function TrainerDashboardByProgram() {
  const {
    studentProgress,
    trainerOrgs,
    trainerPrograms,
    isLoading,
    filterByOrg,
    filterByProgram
  } = useTrainerDashboard({});

  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);

  const handleOrgChange = (orgId: string) => {
    const newOrgId = orgId === '' ? null : orgId;
    setSelectedOrgId(newOrgId);
    filterByOrg(newOrgId);
  };

  const handleProgramChange = (programId: string) => {
    const newProgramId = programId === '' ? null : programId;
    setSelectedProgramId(newProgramId);
    filterByProgram(newProgramId);
  };

  // Stats par programme
  const programStats = trainerPrograms.map(program => {
    const programStudents = studentProgress.filter(s => s.program_id === program.id);
    const avgProgress = programStudents.length > 0
      ? Math.round(programStudents.reduce((sum, s) => sum + s.overall_progress_percent, 0) / programStudents.length)
      : 0;
    const passedEval = programStudents.filter(s => s.evaluation_passed).length;
    const avgScore = programStudents.filter(s => s.best_evaluation_score !== null).length > 0
      ? Math.round(
          programStudents
            .filter(s => s.best_evaluation_score !== null)
            .reduce((sum, s) => sum + (s.best_evaluation_score || 0), 0) /
          programStudents.filter(s => s.best_evaluation_score !== null).length
        )
      : null;

    return {
      ...program,
      studentCount: programStudents.length,
      avgProgress,
      passedEval,
      avgScore
    };
  });

  // Stats globales
  const totalEnrolled = studentProgress.length;
  const avgProgress = studentProgress.length > 0
    ? Math.round(studentProgress.reduce((sum, s) => sum + s.overall_progress_percent, 0) / studentProgress.length)
    : 0;
  const totalPassed = studentProgress.filter(s => s.evaluation_passed).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <TrainerHeader />
      <div className="p-6 pt-8">
        <div className="mx-auto max-w-7xl">
          {/* En-tête */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Suivi par Programme</h1>
                <p className="mt-1 text-gray-600">
                  Suivez la progression de vos apprenants par programme
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  to="/trainer/dashboard/by-org"
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Vue par Organisation
                </Link>
              </div>
            </div>
          </div>

          {/* Onglets */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="flex gap-4">
              <Link
                to="/trainer/dashboard/by-org"
                className="px-4 py-2 text-gray-500 hover:text-gray-700"
              >
                <Building2 className="w-4 h-4 inline-block mr-2" />
                Par Organisation
              </Link>
              <Link
                to="/trainer/dashboard/by-program"
                className="px-4 py-2 text-blue-600 border-b-2 border-blue-600 font-medium"
              >
                <BookOpen className="w-4 h-4 inline-block mr-2" />
                Par Programme
              </Link>
            </nav>
          </div>

          {/* Filtres */}
          <div className="mb-6 bg-white rounded-lg shadow p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Programme
                </label>
                <div className="relative">
                  <select
                    value={selectedProgramId || ''}
                    onChange={(e) => handleProgramChange(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none"
                  >
                    <option value="">Tous les programmes</option>
                    {trainerPrograms.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organisation
                </label>
                <div className="relative">
                  <select
                    value={selectedOrgId || ''}
                    onChange={(e) => handleOrgChange(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none"
                  >
                    <option value="">Toutes les organisations</option>
                    {trainerOrgs.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{trainerPrograms.length}</div>
                  <div className="text-sm text-gray-500">Programmes</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{totalEnrolled}</div>
                  <div className="text-sm text-gray-500">Inscrits total</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{avgProgress}%</div>
                  <div className="text-sm text-gray-500">Progression moyenne</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{totalPassed}</div>
                  <div className="text-sm text-gray-500">Évaluations réussies</div>
                </div>
              </div>
            </div>
          </div>

          {/* Liste des programmes */}
          {!selectedProgramId && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Vos programmes</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {programStats.map((program) => (
                  <div
                    key={program.id}
                    className="bg-white rounded-lg shadow overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <BookOpen className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{program.title}</h3>
                            <p className="text-sm text-gray-500">{program.studentCount} apprenants</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleProgramChange(program.id)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-lg font-semibold text-gray-900">{program.avgProgress}%</div>
                          <div className="text-xs text-gray-500">Progression</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-gray-900">
                            {program.avgScore !== null ? `${program.avgScore}%` : '-'}
                          </div>
                          <div className="text-xs text-gray-500">Score moyen</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-gray-900">{program.passedEval}</div>
                          <div className="text-xs text-gray-500">Validés</div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="h-2 bg-gray-200 rounded-full">
                          <div
                            className="h-2 bg-blue-500 rounded-full"
                            style={{ width: `${program.avgProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex gap-2">
                      <Link
                        to={`/trainer/programs/${program.id}/evaluations`}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <ClipboardCheck className="w-4 h-4" />
                        Évaluations
                      </Link>
                      <Link
                        to={`/trainer/programs/${program.id}/tp`}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded"
                      >
                        <FileText className="w-4 h-4" />
                        TP
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Table de progression */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Progression des apprenants
              {selectedProgramId && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({trainerPrograms.find(p => p.id === selectedProgramId)?.title})
                </span>
              )}
            </h2>
            <StudentProgressTable
              data={studentProgress}
              showOrg={!selectedOrgId}
              showProgram={!selectedProgramId}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
