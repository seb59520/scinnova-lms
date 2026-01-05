/**
 * Requêtes Supabase pour le dashboard Formateur
 */

import { supabase } from '../supabaseClient';
import type {
  Org,
  OrgMember,
  Session,
  SessionKPIs,
  LearnerRow,
  ModuleAnalytics,
  ExerciseAnalytics,
  TrainerNote,
} from '../../types/database';

import { getUserRole } from './userRole';

/**
 * Récupère toutes les organisations d'un formateur/admin
 */
export async function getAllTrainerOrgs(): Promise<{
  orgs: Org[];
  error: Error | null;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { orgs: [], error: new Error('Non authentifié') };
    }

    // Vérifier si admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    // Si admin, retourner toutes les organisations
    if (profile && profile.role === 'admin') {
      const { data: allOrgs, error: orgsError } = await supabase
        .from('orgs')
        .select('*')
        .order('created_at', { ascending: false });

      if (orgsError) {
        return { orgs: [], error: orgsError };
      }

      return { orgs: allOrgs || [], error: null };
    }

    // Sinon, récupérer les organisations où l'utilisateur est membre
    const { data: members, error: membersError } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id);

    if (membersError) {
      return { orgs: [], error: membersError };
    }

    if (!members || members.length === 0) {
      return { orgs: [], error: null };
    }

    const orgIds = members.map(m => m.org_id);
    const { data: orgs, error: orgsError } = await supabase
      .from('orgs')
      .select('*')
      .in('id', orgIds)
      .order('created_at', { ascending: false });

    if (orgsError) {
      return { orgs: [], error: orgsError };
    }

    return { orgs: orgs || [], error: null };
  } catch (error) {
    console.error('❌ Erreur inattendue dans getAllTrainerOrgs:', error);
    return { orgs: [], error: error as Error };
  }
}

/**
 * Récupère le contexte du formateur (org + role)
 * Utilise getUserRole() pour une détermination cohérente du rôle
 */
export async function getTrainerContext(): Promise<{
  org: Org | null;
  role: string | null;
  error: Error | null;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { org: null, role: null, error: new Error('Non authentifié') };
    }

    // Utiliser la fonction unifiée pour déterminer le rôle
    const roleContext = await getUserRole(user.id);
    console.log('🔍 getTrainerContext - Rôle déterminé:', roleContext);

    // Si admin, essayer de trouver une org (mais pas obligatoire)
    if (roleContext.role === 'admin') {
      const { data: anyOrg } = await supabase
        .from('orgs')
        .select('*')
        .limit(1)
        .maybeSingle();

      return { org: anyOrg || null, role: 'admin', error: null };
    }

    // Si le rôle vient de org_members, récupérer l'org
    if (roleContext.orgId) {
      const { data: org, error: orgError } = await supabase
        .from('orgs')
        .select('*')
        .eq('id', roleContext.orgId)
        .single();

      if (orgError) {
        console.error('❌ Erreur lors de la récupération de l\'org:', orgError);
        return { org: null, role: roleContext.role, error: orgError };
      }

      return { org, role: roleContext.role, error: null };
    }

    // Si pas d'org mais un rôle valide (trainer, student, etc.)
    if (roleContext.role) {
      return { org: null, role: roleContext.role, error: null };
    }

    // Aucun rôle trouvé
    return { org: null, role: null, error: new Error('Aucune organisation ou rôle trouvé') };
  } catch (error) {
    console.error('❌ Erreur inattendue dans getTrainerContext:', error);
    return { org: null, role: null, error: error as Error };
  }
}

/**
 * Récupère les sessions actives pour une organisation
 */
export async function getSessions(orgId: string | null, isAdmin: boolean = false): Promise<{
  sessions: Session[];
  error: Error | null;
}> {
  try {
    console.log(`🔍 Chargement des sessions pour orgId: ${orgId}, isAdmin: ${isAdmin}`);
    let query = supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!isAdmin && orgId) {
      query = query.eq('org_id', orgId);
    }
    // Si admin, on ne filtre pas par org_id pour voir toutes les sessions

    console.log('🔍 getSessions - orgId:', orgId, 'isAdmin:', isAdmin);
    const { data, error } = await query;

    if (error) {
      console.error('❌ Erreur lors du chargement des sessions:', error);
      return { sessions: [], error };
    }

    console.log('✅ Sessions chargées:', data?.length || 0, 'sessions');
    if (data && data.length > 0) {
      console.log('📋 Sessions:', data.map(s => ({ id: s.id, title: s.title, org_id: s.org_id, status: s.status })));
    }

    return { sessions: data || [], error: null };
  } catch (error) {
    console.error('❌ Exception lors du chargement des sessions:', error);
    return { sessions: [], error: error as Error };
  }
}

/**
 * Récupère les KPIs d'une session
 */
export async function getSessionKPIs(sessionId: string): Promise<{
  kpis: SessionKPIs | null;
  error: Error | null;
}> {
  try {
    // Récupérer les données de la session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('course_id, org_id')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      return { kpis: null, error: sessionError };
    }

    // Récupérer tous les enrollments de la session
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('user_id')
      .eq('session_id', sessionId)
      .eq('status', 'active');

    const userIds = enrollments?.map((e: any) => e.user_id) || [];

    if (userIds.length === 0) {
      return {
        kpis: {
          active_learners_7d: 0,
          completion_rate: 0,
          avg_score: null,
          difficult_modules: [],
        },
        error: null,
      };
    }

    // Apprenants actifs (7 derniers jours)
    // Chercher dans activity_events avec session_id OU course_id
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Requête 1 : activité liée à la session
    const { data: recentActivityBySession } = await supabase
      .from('activity_events')
      .select('user_id')
      .eq('session_id', sessionId)
      .in('user_id', userIds)
      .gte('created_at', sevenDaysAgo.toISOString());

    // Requête 2 : activité liée au cours (si pas de session_id)
    const { data: recentActivityByCourse } = await supabase
      .from('activity_events')
      .select('user_id')
      .eq('course_id', (session as any).course_id)
      .is('session_id', null)
      .in('user_id', userIds)
      .gte('created_at', sevenDaysAgo.toISOString());

    const allRecentActivity = [
      ...(recentActivityBySession || []),
      ...(recentActivityByCourse || [])
    ];
    const activeUserIds = new Set(allRecentActivity.map((a: any) => a.user_id));
    const active_learners_7d = activeUserIds.size;

    // Taux de complétion
    // Chercher dans module_progress avec session_id OU en trouvant les modules du cours
    const { data: courseModules } = await supabase
      .from('modules')
      .select('id')
      .eq('course_id', (session as any).course_id);

    const moduleIds = courseModules?.map((m: any) => m.id) || [];
    
    // Requête 1 : progressions liées à la session
    const { data: progressBySession } = await supabase
      .from('module_progress')
      .select('user_id, percent')
      .eq('session_id', sessionId)
      .in('user_id', userIds);

    // Requête 2 : progressions liées aux modules du cours (si pas de session_id)
    const { data: progressByModule } = await supabase
      .from('module_progress')
      .select('user_id, percent')
      .in('module_id', moduleIds)
      .is('session_id', null)
      .in('user_id', userIds);

    const allProgress = [
      ...(progressBySession || []),
      ...(progressByModule || [])
    ];
    
    // Calculer le taux de complétion par utilisateur, puis faire la moyenne
    const userProgressMap: Record<string, number[]> = {};
    allProgress.forEach((p: any) => {
      if (!userProgressMap[p.user_id]) {
        userProgressMap[p.user_id] = [];
      }
      userProgressMap[p.user_id].push(p.percent || 0);
    });
    
    // Pour chaque utilisateur, calculer sa moyenne de progression
    const userCompletionRates = Object.values(userProgressMap).map((percentages) => {
      return percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
    });
    
    const completion_rate = userCompletionRates.length > 0 
      ? userCompletionRates.reduce((sum, rate) => sum + rate, 0) / userCompletionRates.length 
      : 0;

    // Score moyen (submissions + game_scores)
    // Chercher les soumissions avec session_id OU en trouvant les items du cours
    const { data: courseItems } = await supabase
      .from('items')
      .select('id')
      .in('module_id', moduleIds);

    const itemIds = courseItems?.map((i: any) => i.id) || [];

    // Requête 1 : soumissions liées à la session
    const { data: submissionsBySession } = await supabase
      .from('submissions')
      .select('grade')
      .eq('session_id', sessionId)
      .in('user_id', userIds)
      .not('grade', 'is', null);

    // Requête 2 : soumissions liées aux items du cours (si pas de session_id)
    const { data: submissionsByItem } = await supabase
      .from('submissions')
      .select('grade')
      .in('item_id', itemIds)
      .is('session_id', null)
      .in('user_id', userIds)
      .not('grade', 'is', null);

    // Récupérer aussi les scores de jeux pour ce cours
    const { data: gameScores } = await supabase
      .from('game_scores')
      .select('score')
      .eq('course_id', (session as any).course_id)
      .in('user_id', userIds);

    const allSubmissionScores = [
      ...(submissionsBySession || []),
      ...(submissionsByItem || [])
    ].map((s: any) => s.grade).filter((g: any) => g !== null);
    const gameScoreValues = gameScores?.map((gs: any) => gs.score / 20).filter((s: any) => s !== null) || []; // Normaliser de 2000 à 100
    const allScores = [...allSubmissionScores, ...gameScoreValues];
    const avg_score = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : null;

    // Modules en difficulté
    // Requête 1 : progressions liées à la session
    const { data: moduleProgressBySession } = await supabase
      .from('module_progress')
      .select('module_id, percent')
      .eq('session_id', sessionId)
      .in('user_id', userIds);

    // Requête 2 : progressions liées aux modules du cours (si pas de session_id)
    const { data: moduleProgressByModule } = await supabase
      .from('module_progress')
      .select('module_id, percent')
      .in('module_id', moduleIds)
      .is('session_id', null)
      .in('user_id', userIds);

    const allModuleProgress = [
      ...(moduleProgressBySession || []),
      ...(moduleProgressByModule || [])
    ];

    const moduleStats: Record<string, { total: number; sum: number }> = {};
    allModuleProgress.forEach((mp: any) => {
      if (!moduleStats[mp.module_id]) {
        moduleStats[mp.module_id] = { total: 0, sum: 0 };
      }
      moduleStats[mp.module_id].total += 1;
      moduleStats[mp.module_id].sum += mp.percent || 0;
    });

    const difficult_modules = Object.entries(moduleStats)
      .map(([moduleId, stats]) => ({
        module_id: moduleId,
        avg_completion: stats.total > 0 ? stats.sum / stats.total : 0,
      }))
      .filter((m) => m.avg_completion < 50)
      .slice(0, 5);

    return {
      kpis: {
        active_learners_7d,
        completion_rate,
        avg_score,
        difficult_modules,
      },
      error: null,
    };
  } catch (error) {
    return { kpis: null, error: error as Error };
  }
}

/**
 * Récupère la table des apprenants pour une session
 */
export async function getLearnersTable(sessionId: string): Promise<{
  learners: LearnerRow[];
  error: Error | null;
}> {
  try {
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select('user_id')
      .eq('session_id', sessionId)
      .eq('status', 'active');

    if (enrollError) {
      return { learners: [], error: enrollError };
    }

    const userIds = enrollments?.map((e: any) => e.user_id) || [];

    if (userIds.length === 0) {
      return { learners: [], error: null };
    }

    // Récupérer les profils avec full_name
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);

    // Récupérer les display_name depuis org_members (si disponibles)
    const { data: orgMembers } = await supabase
      .from('org_members')
      .select('user_id, display_name')
      .in('user_id', userIds);

    // Récupérer le course_id de la session
    const { data: sessionData } = await supabase
      .from('sessions')
      .select('course_id')
      .eq('id', sessionId)
      .single();

    const courseId = (sessionData as any)?.course_id;

    // Récupérer les modules du cours
    const { data: courseModules } = await supabase
      .from('modules')
      .select('id')
      .eq('course_id', courseId);

    const moduleIds = courseModules?.map((m: any) => m.id) || [];

    // Récupérer les progressions (liées à la session OU aux modules du cours)
    const { data: progressBySession } = await supabase
      .from('module_progress')
      .select('user_id, percent')
      .eq('session_id', sessionId)
      .in('user_id', userIds);

    // Aussi chercher les progressions pour les modules du cours (même si session_id différent ou NULL)
    const { data: progressByModule } = await supabase
      .from('module_progress')
      .select('user_id, percent')
      .in('module_id', moduleIds)
      .in('user_id', userIds);

    // Combiner et dédupliquer (garder priorité sur session_id exact)
    const progressMap = new Map<string, { user_id: string; percent: number }>();
    
    // D'abord ajouter celles avec session_id exact
    progressBySession?.forEach((p: any) => {
      progressMap.set(`${p.user_id}-${p.percent}`, p);
    });
    
    // Ensuite ajouter celles par module (si pas déjà ajoutées)
    progressByModule?.forEach((p: any) => {
      const key = `${p.user_id}-${p.percent}`;
      if (!progressMap.has(key)) {
        progressMap.set(key, p);
      }
    });

    const progress = Array.from(progressMap.values());

    // Récupérer les items du cours
    const { data: courseItems } = await supabase
      .from('items')
      .select('id')
      .in('module_id', moduleIds);

    const itemIds = courseItems?.map((i: any) => i.id) || [];

    // Récupérer TOUTES les soumissions (pour la dernière activité) avec submitted_at
    // Inclure aussi les soumissions draft qui ont été modifiées récemment
    const { data: allSubmissionsBySession } = await supabase
      .from('submissions')
      .select('user_id, grade, submitted_at, created_at, updated_at, status')
      .eq('session_id', sessionId)
      .in('user_id', userIds)
      .in('status', ['draft', 'submitted', 'graded']);

    // Aussi chercher les soumissions pour les items du cours (même si session_id différent ou NULL)
    const { data: allSubmissionsByItem } = await supabase
      .from('submissions')
      .select('user_id, grade, submitted_at, created_at, updated_at, status')
      .in('item_id', itemIds)
      .in('user_id', userIds)
      .in('status', ['draft', 'submitted', 'graded']);

    // Récupérer seulement les soumissions notées pour le score moyen
    const submissionsBySession = allSubmissionsBySession?.filter((s: any) => s.grade !== null) || [];
    const submissionsByItem = allSubmissionsByItem?.filter((s: any) => s.grade !== null) || [];

    const submissions = [
      ...submissionsBySession,
      ...submissionsByItem
    ];

    // Toutes les soumissions (pour la dernière activité)
    const allSubmissions = [
      ...(allSubmissionsBySession || []),
      ...(allSubmissionsByItem || [])
    ];

    // Récupérer aussi les scores de jeux pour ce cours
    const { data: gameScores } = await supabase
      .from('game_scores')
      .select('user_id, score')
      .eq('course_id', courseId)
      .in('user_id', userIds);

    // Récupérer la dernière activité (liée à la session OU au cours)
    const { data: activitiesBySession } = await supabase
      .from('activity_events')
      .select('user_id, created_at')
      .eq('session_id', sessionId)
      .in('user_id', userIds)
      .order('created_at', { ascending: false });

    // Aussi chercher les activités pour le cours (même si session_id différent ou NULL)
    const { data: activitiesByCourse } = await supabase
      .from('activity_events')
      .select('user_id, created_at')
      .eq('course_id', courseId)
      .in('user_id', userIds)
      .order('created_at', { ascending: false });

    const activities = [
      ...(activitiesBySession || []),
      ...(activitiesByCourse || [])
    ];

    // Récupérer les soumissions non notées (pour les notifications)
    const { data: unreadSubmissionsBySession } = await supabase
      .from('submissions')
      .select('user_id, submitted_at')
      .eq('session_id', sessionId)
      .in('user_id', userIds)
      .eq('status', 'submitted')
      .is('graded_at', null);

    // Aussi chercher les soumissions non notées pour les items du cours
    const { data: unreadSubmissionsByItem } = await supabase
      .from('submissions')
      .select('user_id, submitted_at')
      .in('item_id', itemIds)
      .in('user_id', userIds)
      .eq('status', 'submitted')
      .is('graded_at', null);

    const unreadSubmissions = [
      ...(unreadSubmissionsBySession || []),
      ...(unreadSubmissionsByItem || [])
    ];

    const learners: LearnerRow[] = userIds.map((userId) => {
      const profile = profiles?.find((p: any) => p.id === userId);
      const orgMember = orgMembers?.find((om: any) => om.user_id === userId);
      const userProgress = progress?.filter((p: any) => p.user_id === userId) || [];
      
      // Combiner les scores des submissions et des jeux
      // Les submissions sont sur 100, les jeux sont sur 2000, donc on normalise les jeux
      const userSubmissionScores = submissions?.filter((s: any) => s.user_id === userId).map((s: any) => s.grade) || [];
      const userGameScores = gameScores?.filter((gs: any) => gs.user_id === userId).map((gs: any) => gs.score / 20) || []; // Normaliser de 2000 à 100
      const userScores = [...userSubmissionScores, ...userGameScores];
      
      // Combiner les activités et les soumissions pour la dernière activité
      const userActivities = activities?.filter((a: any) => a.user_id === userId) || [];
      const userSubmissions = allSubmissions?.filter((s: any) => s.user_id === userId) || [];
      
      // Trouver la dernière activité (activité ou soumission)
      // Utiliser submitted_at en priorité pour les soumissions, sinon updated_at, sinon created_at
      const allUserActivities = [
        ...userActivities.map((a: any) => ({ date: a.created_at, type: 'activity' })),
        ...userSubmissions.map((s: any) => ({ 
          date: s.submitted_at || s.updated_at || s.created_at, 
          type: 'submission' 
        }))
      ].filter((a: any) => a.date && a.date !== null);
      
      // Compter les soumissions non notées
      const unreadCount = unreadSubmissions?.filter((s: any) => s.user_id === userId).length || 0;

      const completion_percent = userProgress.length > 0
        ? userProgress.reduce((sum, p) => sum + (p.percent || 0), 0) / userProgress.length
        : 0;

      const avg_score = userScores.length > 0
        ? userScores.reduce((a, b) => a + b, 0) / userScores.length
        : null;

      // Trier par date décroissante et prendre la plus récente
      allUserActivities.sort((a: any, b: any) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const last_activity_at = allUserActivities.length > 0 ? allUserActivities[0].date : null;

      // Trouver le module avec la plus faible progression
      const moduleProgress = userProgress.map((p: any) => p.percent || 0);
      const minProgress = Math.min(...moduleProgress, 100);
      const main_blockage = minProgress < 50 ? `Module bloqué (${Math.round(minProgress)}%)` : null;

      // Utiliser display_name de org_members en priorité, sinon full_name de profiles
      const display_name = orgMember?.display_name || profile?.full_name || 'Utilisateur inconnu';

      return {
        user_id: userId,
        display_name,
        completion_percent,
        avg_score,
        last_activity_at,
        main_blockage,
        unread_submissions_count: unreadCount,
      };
    });

    return { learners, error: null };
  } catch (error) {
    return { learners: [], error: error as Error };
  }
}

/**
 * Récupère les analyses des modules pour une session
 */
export async function getModuleAnalytics(sessionId: string): Promise<{
  analytics: ModuleAnalytics[];
  error: Error | null;
}> {
  try {
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('course_id')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      return { analytics: [], error: sessionError };
    }

    const courseId = (sessionData as any).course_id;

    // Récupérer tous les modules du cours
    const { data: modules } = await supabase
      .from('modules')
      .select('id, title')
      .eq('course_id', courseId);

    const analytics: ModuleAnalytics[] = [];

    // Récupérer tous les user_ids de la session
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('user_id')
      .eq('session_id', sessionId)
      .eq('status', 'active');

    const userIds = enrollments?.map((e: any) => e.user_id) || [];

    for (const module of modules || []) {
      // Récupérer les progressions pour ce module (avec session_id OU sans)
      const { data: progressBySession } = await supabase
        .from('module_progress')
        .select('user_id, percent, updated_at, started_at')
        .eq('module_id', module.id)
        .eq('session_id', sessionId)
        .in('user_id', userIds);

      const { data: progressByModule } = await supabase
        .from('module_progress')
        .select('user_id, percent, updated_at, started_at')
        .eq('module_id', module.id)
        .in('user_id', userIds);

      // Combiner et dédupliquer (priorité sur session_id exact)
      const progressMap = new Map<string, any>();
      progressBySession?.forEach((p: any) => {
        progressMap.set(p.user_id, p);
      });
      progressByModule?.forEach((p: any) => {
        if (!progressMap.has(p.user_id)) {
          progressMap.set(p.user_id, p);
        }
      });

      const progress = Array.from(progressMap.values());

      const totalUsers = userIds.length;
      const completedUsers = progress?.filter((p: any) => (p.percent || 0) >= 100).length || 0;
      const startedUsers = progress?.filter((p: any) => (p.percent || 0) > 0).length || 0;
      const abandon_rate = startedUsers > 0 ? ((startedUsers - completedUsers) / startedUsers) * 100 : 0;

      // Temps moyen basé sur started_at et updated_at
      // Si started_at est NULL, utiliser une estimation basée sur la progression
      const times = progress
        ?.filter((p: any) => p.updated_at)
        .map((p: any) => {
          if (p.started_at && p.updated_at) {
            const start = new Date(p.started_at).getTime();
            const end = new Date(p.updated_at).getTime();
            const diffMinutes = Math.max(0, (end - start) / (1000 * 60));
            return diffMinutes;
          } else if (p.updated_at) {
            // Estimation : 30 minutes par 10% de progression
            const estimatedMinutes = Math.max(5, (p.percent || 0) * 0.3);
            return estimatedMinutes;
          }
          return 0;
        })
        .filter((t: number) => t > 0) || [];
      const avg_time_minutes = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;

      // Score moyen (basé sur les submissions et game_scores des items de ce module)
      const { data: items } = await supabase
        .from('items')
        .select('id')
        .eq('module_id', module.id);

      const itemIds = items?.map((i: any) => i.id) || [];
      
      // Récupérer les soumissions (avec session_id OU sans)
      const { data: submissionsBySession } = await supabase
        .from('submissions')
        .select('grade')
        .in('item_id', itemIds)
        .eq('session_id', sessionId)
        .in('user_id', userIds)
        .not('grade', 'is', null);

      const { data: submissionsByItem } = await supabase
        .from('submissions')
        .select('grade')
        .in('item_id', itemIds)
        .in('user_id', userIds)
        .not('grade', 'is', null);

      // Récupérer aussi les scores de jeux pour ce module
      const { data: gameScores } = await supabase
        .from('game_scores')
        .select('score')
        .eq('course_id', courseId)
        .in('item_id', itemIds)
        .in('user_id', userIds);

      const submissionScores = [
        ...(submissionsBySession || []),
        ...(submissionsByItem || [])
      ].map((s: any) => s.grade).filter((g: any) => g !== null);
      
      const gameScoreValues = gameScores?.map((gs: any) => gs.score / 20).filter((s: any) => s !== null) || []; // Normaliser de 2000 à 100
      const allScores = [...submissionScores, ...gameScoreValues];
      const avg_score = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : null;

      analytics.push({
        module_id: module.id,
        module_title: module.title,
        abandon_rate,
        avg_time_minutes,
        avg_score,
      });
    }

    return { analytics, error: null };
  } catch (error) {
    return { analytics: [], error: error as Error };
  }
}

export async function getExerciseAnalytics(sessionId: string): Promise<{
  analytics: ExerciseAnalytics[];
  error: Error | null;
}> {
  try {
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('course_id')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      return { analytics: [], error: sessionError };
    }

    const courseId = (sessionData as any).course_id;

    // Récupérer tous les exercices du cours
    const { data: modules } = await supabase
      .from('modules')
      .select('id')
      .eq('course_id', courseId);

    const moduleIds = modules?.map((m: any) => m.id) || [];
    const { data: items } = await supabase
      .from('items')
      .select('id, title')
      .in('module_id', moduleIds)
      .eq('type', 'exercise');

    const { data: exercises } = await supabase
      .from('exercises')
      .select('id, item_id')
      .in('item_id', items?.map((i: any) => i.id) || []);

    const analytics: ExerciseAnalytics[] = [];

    for (const exercise of exercises || []) {
      const item = items?.find((i: any) => i.id === exercise.item_id);
      const { data: attempts } = await supabase
        .from('exercise_attempts')
        .select('score, is_correct, answer_json, metadata')
        .eq('exercise_id', exercise.id)
        .eq('session_id', sessionId);

      const totalAttempts = attempts?.length || 0;
      const failedAttempts = attempts?.filter((a: any) => !a.is_correct || (a.score !== null && a.score < 60)).length || 0;
      const failure_rate = totalAttempts > 0 ? (failedAttempts / totalAttempts) * 100 : 0;

      const scores = attempts?.filter((a: any) => a.score !== null).map((a: any) => a.score) || [];
      const avg_score = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : null;

      // Top erreurs (simplifié - analyser answer_json/metadata si disponible)
      const top_errors: Array<{ error: string; count: number }> = [];
      // TODO: Implémenter l'analyse des erreurs depuis answer_json/metadata

      analytics.push({
        exercise_id: exercise.id,
        exercise_title: item?.title || 'Exercice inconnu',
        failure_rate,
        avg_score,
        top_errors,
      });
    }

    return { analytics, error: null };
  } catch (error) {
    return { analytics: [], error: error as Error };
  }
}

/**
 * Récupère les résultats détaillés d'un exercice pour une session
 */
export async function getExerciseResults(
  sessionId: string,
  exerciseId: string
): Promise<{
  results: Array<{
    user_id: string;
    display_name: string;
    attempt_number: number;
    answer_text: string | null;
    answer_json: any;
    score: number | null;
    is_correct: boolean | null;
    feedback: string | null;
    submitted_at: string;
  }>;
  exercise_title: string;
  error: Error | null;
}> {
  try {
    // Récupérer l'exercice et son item
    const { data: exercise, error: exerciseError } = await supabase
      .from('exercises')
      .select('item_id')
      .eq('id', exerciseId)
      .single();

    if (exerciseError) {
      return { results: [], exercise_title: '', error: exerciseError };
    }

    const { data: item } = await supabase
      .from('items')
      .select('title')
      .eq('id', exercise.item_id)
      .single();

    // Récupérer toutes les tentatives pour cet exercice dans cette session
    const { data: attempts, error: attemptsError } = await supabase
      .from('exercise_attempts')
      .select('user_id, attempt_number, answer_text, answer_json, score, is_correct, feedback, submitted_at')
      .eq('exercise_id', exerciseId)
      .eq('session_id', sessionId)
      .order('submitted_at', { ascending: false });

    if (attemptsError) {
      return { results: [], exercise_title: item?.title || '', error: attemptsError };
    }

    // Récupérer les profils des utilisateurs
    const userIds = [...new Set(attempts?.map((a: any) => a.user_id) || [])];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);

    // Récupérer les display_name depuis org_members
    const { data: orgMembers } = await supabase
      .from('org_members')
      .select('user_id, display_name')
      .in('user_id', userIds);

    // Combiner les données
    const results = (attempts || []).map((attempt: any) => {
      const profile = profiles?.find((p: any) => p.id === attempt.user_id);
      const orgMember = orgMembers?.find((om: any) => om.user_id === attempt.user_id);
      const display_name = orgMember?.display_name || profile?.full_name || 'Utilisateur inconnu';
      
      return {
        user_id: attempt.user_id,
        display_name,
        attempt_number: attempt.attempt_number,
        answer_text: attempt.answer_text,
        answer_json: attempt.answer_json,
        score: attempt.score,
        is_correct: attempt.is_correct,
        feedback: attempt.feedback,
        submitted_at: attempt.submitted_at,
      };
    });

    return {
      results,
      exercise_title: item?.title || 'Exercice inconnu',
      error: null,
    };
  } catch (error) {
    return { results: [], exercise_title: '', error: error as Error };
  }
}

/**
 * Récupère les notes du formateur
 */
export async function getTrainerNotes(
  trainerId: string,
  orgId: string,
  filters?: {
    course_id?: string;
    module_id?: string;
    session_id?: string;
    user_id?: string;
  }
): Promise<{
  notes: TrainerNote[];
  error: Error | null;
}> {
  try {
    let query = supabase
      .from('trainer_notes')
      .select('*')
      .eq('trainer_id', trainerId)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (filters?.course_id) {
      query = query.eq('course_id', filters.course_id);
    }
    if (filters?.module_id) {
      query = query.eq('module_id', filters.module_id);
    }
    if (filters?.session_id) {
      query = query.eq('session_id', filters.session_id);
    }
    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    const { data, error } = await query;

    if (error) {
      return { notes: [], error };
    }

    return { notes: data || [], error: null };
  } catch (error) {
    return { notes: [], error: error as Error };
  }
}

/**
 * Crée une note formateur
 */
export async function createTrainerNote(
  note: Omit<TrainerNote, 'id' | 'created_at' | 'updated_at'>
): Promise<{ note: TrainerNote | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('trainer_notes')
      .insert(note)
      .select()
      .single();

    if (error) {
      return { note: null, error };
    }

    return { note: data as TrainerNote, error: null };
  } catch (error) {
    return { note: null, error: error as Error };
  }
}

/**
 * Met à jour une note formateur
 */
export async function updateTrainerNote(
  noteId: string,
  updates: Partial<Omit<TrainerNote, 'id' | 'created_at' | 'updated_at'>>
): Promise<{ note: TrainerNote | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('trainer_notes')
      .update(updates)
      .eq('id', noteId)
      .select()
      .single();

    if (error) {
      return { note: null, error };
    }

    return { note: data as TrainerNote, error: null };
  } catch (error) {
    return { note: null, error: error as Error };
  }
}

/**
 * Supprime une note formateur
 */
export async function deleteTrainerNote(noteId: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('trainer_notes')
      .delete()
      .eq('id', noteId);

    if (error) {
      return { error };
    }

    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Récupère toutes les soumissions d'un apprenant pour une session
 */
export async function getLearnerSubmissions(
  sessionId: string,
  userId: string
): Promise<{
  submissions: Array<{
    id: string;
    item_id: string;
    item_title: string;
    item_type: string;
    module_title: string;
    answer_text: string | null;
    answer_json: Record<string, any> | null;
    file_path: string | null;
    status: string;
    grade: number | null;
    submitted_at: string;
    graded_at: string | null;
  }>;
  error: Error | null;
}> {
  try {
    // Récupérer la session pour obtenir le course_id
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('course_id')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      return { submissions: [], error: sessionError };
    }

    // Récupérer toutes les soumissions de l'apprenant pour cette session
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false });

    if (submissionsError) {
      return { submissions: [], error: submissionsError };
    }

    if (!submissions || submissions.length === 0) {
      return { submissions: [], error: null };
    }

    // Récupérer les détails des items (titre, type, module)
    const itemIds = submissions.map((s: any) => s.item_id);
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select(`
        id,
        title,
        type,
        module_id,
        modules (
          id,
          title
        )
      `)
      .in('id', itemIds);

    if (itemsError) {
      return { submissions: [], error: itemsError };
    }

    // Combiner les données
    const submissionsWithDetails = submissions.map((submission: any) => {
      const item = items?.find((i: any) => i.id === submission.item_id);
      // Gérer le cas où modules peut être un tableau ou un objet
      let moduleTitle = 'Module inconnu';
      if (item?.modules) {
        if (Array.isArray(item.modules) && item.modules.length > 0) {
          moduleTitle = item.modules[0].title || 'Module inconnu';
        } else if (!Array.isArray(item.modules)) {
          moduleTitle = item.modules.title || 'Module inconnu';
        }
      }
      
      return {
        id: submission.id,
        item_id: submission.item_id,
        item_title: item?.title || 'Item inconnu',
        item_type: item?.type || 'unknown',
        module_title: moduleTitle,
        answer_text: submission.answer_text,
        answer_json: submission.answer_json,
        file_path: submission.file_path,
        status: submission.status,
        grade: submission.grade,
        submitted_at: submission.submitted_at,
        graded_at: submission.graded_at,
      };
    });

    return { submissions: submissionsWithDetails, error: null };
  } catch (error) {
    return { submissions: [], error: error as Error };
  }
}
