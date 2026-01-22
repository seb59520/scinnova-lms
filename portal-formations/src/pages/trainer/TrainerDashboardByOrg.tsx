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
  Activity,
  BarChart3
} from 'lucide-react';

export function TrainerDashboardByOrg() {
  const {
    studentProgress,
    orgStats,
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

  // Stats globales
  const totalStudents = orgStats.reduce((sum, org) => sum + org.total_students, 0);
  const activeStudents = orgStats.reduce((sum, org) => sum + org.active_students_7d, 0);
  const avgProgress = studentProgress.length > 0
    ? Math.round(studentProgress.reduce((sum, s) => sum + s.overall_progress_percent, 0) / studentProgress.length)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <TrainerHeader />
      <div className="p-6 pt-8">
        <div className="mx-auto max-w-7xl">
          {/* En-tête */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Suivi par Organisation</h1>
                <p className="mt-1 text-gray-600">
                  Suivez la progression de vos apprenants par organisation
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  to="/trainer/dashboard/by-program"
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Vue par Programme
                </Link>
              </div>
            </div>
          </div>

          {/* Onglets */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="flex gap-4">
              <Link
                to="/trainer/dashboard/by-org"
                className="px-4 py-2 text-blue-600 border-b-2 border-blue-600 font-medium"
              >
                <Building2 className="w-4 h-4 inline-block mr-2" />
                Par Organisation
              </Link>
              <Link
                to="/trainer/dashboard/by-program"
                className="px-4 py-2 text-gray-500 hover:text-gray-700"
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
            </div>
          </div>

          {/* KPIs */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{trainerOrgs.length}</div>
                  <div className="text-sm text-gray-500">Organisations</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{totalStudents}</div>
                  <div className="text-sm text-gray-500">Apprenants total</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Activity className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{activeStudents}</div>
                  <div className="text-sm text-gray-500">Actifs (7j)</div>
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
          </div>

          {/* Stats par organisation */}
          {!selectedOrgId && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistiques par organisation</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {orgStats.map((org) => (
                  <div
                    key={org.org_id}
                    className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleOrgChange(org.org_id)}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="font-medium text-gray-900">{org.org_name}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Apprenants:</span>
                        <span className="ml-1 font-medium">{org.total_students}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Actifs (7j):</span>
                        <span className="ml-1 font-medium">{org.active_students_7d}</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progression</span>
                        <span>{org.avg_progress_percent}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-2 bg-blue-500 rounded-full"
                          style={{ width: `${org.avg_progress_percent}%` }}
                        />
                      </div>
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
              {selectedOrgId && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({trainerOrgs.find(o => o.id === selectedOrgId)?.name})
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
