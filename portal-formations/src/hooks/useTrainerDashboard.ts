import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './useAuth';
import type {
  StudentProgramProgress,
  OrgProgressStats,
  ProgramProgressStats,
  Org,
  Program
} from '../types/database';

interface UseTrainerDashboardOptions {
  orgId?: string;
  programId?: string;
}

interface UseTrainerDashboardReturn {
  // Données
  studentProgress: StudentProgramProgress[];
  orgStats: OrgProgressStats[];
  programStats: ProgramProgressStats[];
  trainerOrgs: Org[];
  trainerPrograms: Program[];

  // État
  isLoading: boolean;
  error: string | null;

  // Filtres
  filterByOrg: (orgId: string | null) => void;
  filterByProgram: (programId: string | null) => void;
  searchStudents: (query: string) => void;

  // Rafraîchissement
  refresh: () => Promise<void>;
}

export function useTrainerDashboard({
  orgId,
  programId
}: UseTrainerDashboardOptions = {}): UseTrainerDashboardReturn {
  const { user } = useAuth();

  const [studentProgress, setStudentProgress] = useState<StudentProgramProgress[]>([]);
  const [orgStats, setOrgStats] = useState<OrgProgressStats[]>([]);
  const [programStats, setProgramStats] = useState<ProgramProgressStats[]>([]);
  const [trainerOrgs, setTrainerOrgs] = useState<Org[]>([]);
  const [trainerPrograms, setTrainerPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(orgId || null);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(programId || null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // 1. Vérifier si admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const isAdmin = profile?.role === 'admin';

      // 2. Charger les organisations et programmes en parallèle
      const [orgsResult, programsResult] = await Promise.all([
        // Charger les organisations
        isAdmin
          ? supabase.from('orgs').select('*').order('name')
          : supabase
              .from('org_members')
              .select(`org_id, orgs (*)`)
              .eq('user_id', user.id)
              .in('role', ['admin', 'trainer']),
        // Charger TOUS les programmes publiés (solution simple et rapide)
        supabase
          .from('programs')
          .select('*')
          .eq('status', 'published')
          .order('title')
      ]);

      // Traiter les organisations
      let orgs: Org[] = [];
      if (isAdmin) {
        orgs = orgsResult.data || [];
      } else {
        orgs = (orgsResult.data as any[])?.map(m => m.orgs).filter(Boolean) as Org[] || [];
      }
      setTrainerOrgs(orgs);

      // Traiter les programmes
      setTrainerPrograms(programsResult.data || []);

      // 3. Charger les stats par organisation en une seule requête
      if (orgs.length > 0) {
        const orgIds = orgs.map(o => o.id);

        // Compter tous les étudiants par org en une requête
        const { data: memberCounts } = await supabase
          .from('org_members')
          .select('org_id')
          .in('org_id', orgIds)
          .eq('role', 'student');

        // Calculer les stats
        const countByOrg = new Map<string, number>();
        (memberCounts || []).forEach(m => {
          countByOrg.set(m.org_id, (countByOrg.get(m.org_id) || 0) + 1);
        });

        const loadedOrgStats: OrgProgressStats[] = orgs.map(org => ({
          org_id: org.id,
          org_name: org.name,
          total_students: countByOrg.get(org.id) || 0,
          active_students_7d: 0,
          avg_progress_percent: 0,
          completed_count: 0,
          in_progress_count: 0,
          not_started_count: countByOrg.get(org.id) || 0
        }));
        setOrgStats(loadedOrgStats);
      }

      // 4. Charger la progression des étudiants
      await loadStudentProgress(selectedOrgId, selectedProgramId, orgs, isAdmin);

    } catch (err) {
      console.error('Error loading trainer dashboard:', err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedOrgId, selectedProgramId]);

  const loadStudentProgress = async (
    orgIdFilter: string | null,
    programIdFilter: string | null,
    orgs: Org[],
    isAdmin: boolean
  ) => {
    if (!user) return;

    try {
      // 1. Récupérer les membres des organisations (avec limite raisonnable)
      let membersQuery = supabase
        .from('org_members')
        .select(`
          user_id,
          org_id,
          orgs (name),
          profiles:user_id (full_name)
        `)
        .eq('role', 'student');

      if (orgIdFilter) {
        membersQuery = membersQuery.eq('org_id', orgIdFilter);
      } else if (!isAdmin && orgs.length > 0) {
        membersQuery = membersQuery.in('org_id', orgs.map(o => o.id));
      }

      const { data: membersData, error: membersError } = await membersQuery.limit(50);

      if (membersError) {
        console.error('Error loading members:', membersError);
        return;
      }

      if (!membersData || membersData.length === 0) {
        setStudentProgress([]);
        return;
      }

      const userIds = membersData.map(m => m.user_id);

      // 2. Charger toutes les données en parallèle (batch queries)
      const [enrollmentsResult, moduleProgressResult, programCoursesResult] = await Promise.all([
        // Toutes les inscriptions actives pour ces utilisateurs
        programIdFilter
          ? supabase
              .from('program_enrollments')
              .select(`program_id, user_id, programs (id, title)`)
              .in('user_id', userIds)
              .eq('status', 'active')
              .eq('program_id', programIdFilter)
          : supabase
              .from('program_enrollments')
              .select(`program_id, user_id, programs (id, title)`)
              .in('user_id', userIds)
              .eq('status', 'active'),

        // Toute la progression des modules pour ces utilisateurs
        supabase
          .from('module_progress')
          .select(`
            user_id,
            module_id,
            percent,
            updated_at,
            modules (id, title, course_id, courses (id, title))
          `)
          .in('user_id', userIds)
          .order('updated_at', { ascending: false }),

        // Tous les cours des programmes
        supabase
          .from('program_courses')
          .select('program_id, course_id')
      ]);

      const enrollments = enrollmentsResult.data || [];
      const allModuleProgress = moduleProgressResult.data || [];
      const allProgramCourses = programCoursesResult.data || [];

      // 3. Créer des maps pour accès rapide
      const enrollmentsByUser = new Map<string, typeof enrollments>();
      enrollments.forEach(e => {
        if (!enrollmentsByUser.has(e.user_id)) {
          enrollmentsByUser.set(e.user_id, []);
        }
        enrollmentsByUser.get(e.user_id)!.push(e);
      });

      const progressByUser = new Map<string, typeof allModuleProgress>();
      allModuleProgress.forEach(mp => {
        if (!progressByUser.has(mp.user_id)) {
          progressByUser.set(mp.user_id, []);
        }
        progressByUser.get(mp.user_id)!.push(mp);
      });

      const coursesByProgram = new Map<string, string[]>();
      allProgramCourses.forEach(pc => {
        if (!coursesByProgram.has(pc.program_id)) {
          coursesByProgram.set(pc.program_id, []);
        }
        coursesByProgram.get(pc.program_id)!.push(pc.course_id);
      });

      // 4. Construire les données de progression
      const progressData: StudentProgramProgress[] = [];

      for (const member of membersData) {
        const userEnrollments = enrollmentsByUser.get(member.user_id) || [];
        const userProgress = progressByUser.get(member.user_id) || [];

        if (userEnrollments.length === 0) {
          progressData.push({
            user_id: member.user_id,
            user_name: (member.profiles as { full_name: string })?.full_name || 'Inconnu',
            org_id: member.org_id,
            org_name: (member.orgs as { name: string })?.name || 'Inconnu',
            program_id: '',
            program_title: 'Aucun programme',
            total_courses: 0,
            completed_courses: 0,
            current_course_id: null,
            current_course_title: null,
            current_module_id: null,
            current_module_title: null,
            last_activity_at: null,
            overall_progress_percent: 0,
            evaluation_attempts: 0,
            best_evaluation_score: null,
            evaluation_passed: null
          });
          continue;
        }

        for (const enrollment of userEnrollments) {
          if (!enrollment.programs) continue;

          const programCourseIds = coursesByProgram.get(enrollment.program_id) || [];
          const totalCourses = programCourseIds.length;

          // Filtrer la progression pour les cours de ce programme
          const programModules = userProgress.filter(mp =>
            mp.modules && programCourseIds.includes((mp.modules as any).course_id)
          );

          let avgProgress = 0;
          let completedCourses = 0;
          let currentCourseId: string | null = null;
          let currentCourseTitle: string | null = null;
          let currentModuleId: string | null = null;
          let currentModuleTitle: string | null = null;
          let lastActivityAt: string | null = null;

          if (programModules.length > 0) {
            avgProgress = Math.round(
              programModules.reduce((sum, mp) => sum + (mp.percent || 0), 0) / programModules.length
            );

            const latestModule = programModules[0];
            if (latestModule?.modules) {
              const moduleData = latestModule.modules as any;
              currentModuleId = moduleData.id;
              currentModuleTitle = moduleData.title;
              currentCourseId = moduleData.course_id;
              currentCourseTitle = moduleData.courses?.title || null;
              lastActivityAt = latestModule.updated_at;
            }

            const courseProgress = new Map<string, number[]>();
            programModules.forEach(mp => {
              const courseId = (mp.modules as any)?.course_id;
              if (courseId) {
                if (!courseProgress.has(courseId)) courseProgress.set(courseId, []);
                courseProgress.get(courseId)!.push(mp.percent || 0);
              }
            });

            completedCourses = Array.from(courseProgress.values()).filter(
              percents => percents.every(p => p >= 100)
            ).length;
          }

          progressData.push({
            user_id: member.user_id,
            user_name: (member.profiles as { full_name: string })?.full_name || 'Inconnu',
            org_id: member.org_id,
            org_name: (member.orgs as { name: string })?.name || 'Inconnu',
            program_id: enrollment.program_id,
            program_title: (enrollment.programs as { title: string })?.title || 'Inconnu',
            total_courses: totalCourses,
            completed_courses: completedCourses,
            current_course_id: currentCourseId,
            current_course_title: currentCourseTitle,
            current_module_id: currentModuleId,
            current_module_title: currentModuleTitle,
            last_activity_at: lastActivityAt,
            overall_progress_percent: avgProgress,
            evaluation_attempts: 0,
            best_evaluation_score: null,
            evaluation_passed: null
          });
        }
      }

      // 5. Filtrer par recherche si nécessaire
      const filteredProgress = searchQuery
        ? progressData.filter(p =>
            p.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.org_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.program_title.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : progressData;

      setStudentProgress(filteredProgress);
    } catch (err) {
      console.error('Error loading student progress:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Recharger quand les filtres changent
  useEffect(() => {
    if (!isLoading && trainerOrgs.length > 0) {
      const isAdmin = trainerOrgs.length > 0; // Simplifié
      loadStudentProgress(selectedOrgId, selectedProgramId, trainerOrgs, isAdmin);
    }
  }, [selectedOrgId, selectedProgramId, searchQuery]);

  const filterByOrg = (id: string | null) => {
    setSelectedOrgId(id);
  };

  const filterByProgram = (id: string | null) => {
    setSelectedProgramId(id);
  };

  const searchStudents = (query: string) => {
    setSearchQuery(query);
  };

  return {
    studentProgress,
    orgStats,
    programStats,
    trainerOrgs,
    trainerPrograms,
    isLoading,
    error,
    filterByOrg,
    filterByProgram,
    searchStudents,
    refresh: loadData
  };
}
