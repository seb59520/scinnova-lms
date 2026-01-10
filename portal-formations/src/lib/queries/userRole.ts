/**
 * Fonction unifiée pour déterminer le rôle d'un utilisateur
 * Priorité : profiles.role === 'admin' > org_members.role > profiles.role
 */

import { supabase } from '../supabaseClient';

export type UnifiedRole = 'admin' | 'trainer' | 'student' | 'instructor' | 'auditor' | null;

export interface UserRoleContext {
  role: UnifiedRole;
  source: 'profiles_admin' | 'org_members' | 'profiles_default';
  orgId: string | null;
}

/**
 * Récupère le rôle unifié d'un utilisateur
 * Cette fonction garantit une détermination cohérente du rôle
 * @param userId - ID de l'utilisateur
 * @param profileFromCache - Profil déjà chargé (optionnel, pour éviter une requête supplémentaire)
 */
export async function getUserRole(userId: string, profileFromCache?: any): Promise<UserRoleContext> {
  try {
    console.log('🔍 getUserRole - Début pour userId:', userId);

    let profile = profileFromCache;
    let profileError: any = null;

    // 1. Vérifier d'abord le profil (utiliser le cache si disponible)
    // C'EST LA PRIORITÉ ABSOLUE - sans profil, on ne peut pas déterminer le rôle
    if (!profile) {
      try {
        console.log('🔍 [getUserRole] Récupération du profil depuis la base de données...');
        
        // Note: On ne filtre pas par is_active ici car on doit pouvoir détecter le rôle admin
        // même si is_active est NULL (rétrocompatibilité)
        // Essayer d'abord sans filtre is_active pour garantir l'accès
        // La politique RLS "Users can always view their own profile" devrait permettre cela
        // IMPORTANT: Ne pas filtrer par is_active ici car on doit pouvoir lire son propre profil
        // même si is_active est false (pour permettre la réactivation)
        // Requête simple sans retry complexe - RLS désactivé donc devrait être rapide
        const profileResult = await supabase
          .from('profiles')
          .select('role, full_name, created_at, is_active')
          .eq('id', userId)
          .maybeSingle();
        
        const result = profileResult || { data: null, error: null };
        profile = result.data;
        profileError = result.error;
        
        if (profile) {
          console.log('✅ [getUserRole] Profil récupéré avec succès:', { id: profile.id, role: profile.role });
        } else if (profileError) {
          console.error('❌ [getUserRole] Erreur lors de la récupération du profil:', profileError);
        } else {
          console.warn('⚠️ [getUserRole] Aucun profil trouvé pour userId:', userId);
        }
      } catch (error: any) {
        // En cas de timeout, continuer sans profil
        console.error('❌ [getUserRole] Timeout lors de la récupération du profil:', error);
        profileError = error;
        profile = null;
      }
    } else {
      console.log('✅ [getUserRole] Utilisation du profil en cache:', { id: profile.id, role: profile.role });
    }

    if (profileError) {
      console.error('❌ Erreur lors de la récupération du profil:', profileError);
      console.error('❌ Code erreur:', profileError.code);
      console.error('❌ Message:', profileError.message);
      console.error('❌ Détails:', profileError.details);
      console.error('❌ Hint:', profileError.hint);
    }

    console.log('📋 Profil récupéré:', profile);
    console.log('📋 is_active:', profile?.is_active);
    console.log('📋 role:', profile?.role);
    
    if (!profile) {
      console.error('❌ Aucun profil trouvé pour userId:', userId);
      console.error('❌ Cela peut signifier :');
      console.error('   1. Le profil n\'existe pas dans la base de données');
      console.error('   2. Les policies RLS bloquent l\'accès');
      console.error('   3. L\'utilisateur n\'est pas authentifié correctement');
      console.error('❌ ACTION: Vérifiez les policies RLS dans Supabase');
      console.error('❌ ACTION: Vérifiez que votre profil existe avec role = \'admin\'');
    } else {
      console.log('✅ Profil trouvé - role:', profile.role, 'is_active:', profile.is_active);
    }

    // 2. Si admin dans profiles, retourner immédiatement 'admin'
    // (priorité absolue pour les admins)
    if (profile && profile.role === 'admin') {
      console.log('✅ Rôle déterminé: admin (depuis profiles)');
      return {
        role: 'admin',
        source: 'profiles_admin',
        orgId: null,
      };
    }

    // 3. Chercher dans org_members (si l'utilisateur est dans une organisation)
    // Requête simple sans retry complexe - RLS désactivé donc devrait être rapide
    let members: any[] | null = null;
    let memberError: any = null;
    
    try {
      const membersResult = await supabase
        .from('org_members')
        .select('org_id, role, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      members = membersResult.data;
      memberError = membersResult.error;
    } catch (error: any) {
      console.warn('⚠️ Erreur lors de la récupération des org_members (non critique):', error?.message || error);
      memberError = error;
      members = null;
    }

    if (memberError) {
      console.warn('⚠️ Erreur lors de la récupération des membres (non critique):', memberError);
    }

    if (members && members.length > 0) {
      console.log('📋 Membres récupérés:', members);
    } else {
      console.log('📋 Aucun membre d\'organisation trouvé (normal si l\'utilisateur n\'est pas dans une org)');
    }

    // 4. Si trouvé dans org_members, utiliser ce rôle
    if (members && members.length > 0) {
      const member = members[0];
      console.log('✅ Rôle déterminé:', member.role, '(depuis org_members, org:', member.org_id, ')');
      
      // Mapper les rôles org_members vers les rôles unifiés
      const unifiedRole: UnifiedRole = 
        member.role === 'admin' ? 'admin' :
        member.role === 'trainer' ? 'trainer' :
        member.role === 'student' ? 'student' :
        member.role === 'auditor' ? 'auditor' :
        'student'; // Par défaut

      return {
        role: unifiedRole,
        source: 'org_members',
        orgId: member.org_id,
      };
    }

    // 5. Fallback : utiliser le rôle du profil (student, instructor, etc.)
    if (profile) {
      const unifiedRole: UnifiedRole = 
        profile.role === 'admin' ? 'admin' :
        profile.role === 'instructor' ? 'trainer' : // Mapper instructor -> trainer
        profile.role === 'student' ? 'student' :
        'student'; // Par défaut

      console.log('✅ Rôle déterminé:', unifiedRole, '(depuis profiles, fallback)');
      return {
        role: unifiedRole,
        source: 'profiles_default',
        orgId: null,
      };
    }

    // 6. Aucun rôle trouvé - mais on continue quand même
    console.warn('⚠️ Aucun rôle trouvé pour userId:', userId);
    console.warn('⚠️ Profil:', profile ? 'existe mais sans rôle valide' : 'n\'existe pas');
    console.warn('⚠️ Membres org:', members && members.length > 0 ? `${members.length} trouvé(s)` : 'aucun');
    
    // Si le profil n'existe pas, essayer de le créer automatiquement
    if (!profile) {
      console.warn('⚠️ Profil manquant, tentative de création automatique...');
      try {
        // Récupérer les infos utilisateur depuis auth.users via une fonction RPC ou directement
        const { data: authUser } = await supabase.auth.getUser();
        const userEmail = authUser?.user?.email || '';
        const userName = authUser?.user?.user_metadata?.full_name || 
                        authUser?.user?.user_metadata?.name || 
                        userEmail.split('@')[0] || 
                        'Utilisateur';
        
        // Essayer de créer le profil avec rôle admin par défaut pour les utilisateurs existants
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            role: 'admin', // Rôle admin par défaut pour les utilisateurs existants
            full_name: userName,
            is_active: null // NULL = actif
          })
          .select()
          .single();
        
        if (!createError && newProfile) {
          console.log('✅ Profil créé automatiquement:', newProfile);
          profile = newProfile;
          // Retourner le rôle admin maintenant que le profil est créé
          return {
            role: 'admin',
            source: 'profiles_admin',
            orgId: null,
          };
        } else {
          console.error('❌ Impossible de créer le profil automatiquement:', createError);
          console.error('❌ Le profil existe peut-être mais n\'est pas accessible à cause des politiques RLS');
          console.error('❌ ACTION REQUISE: Exécutez le script SQL test-auth-uid-and-rls.sql pour diagnostiquer');
        }
      } catch (createErr: any) {
        console.error('❌ Erreur lors de la création automatique du profil:', createErr);
        console.error('❌ Le profil existe peut-être mais n\'est pas accessible à cause des politiques RLS');
      }
    }
    
    // Retourner un rôle par défaut plutôt que null pour éviter les problèmes d'UI
    // Mais loguer un avertissement pour indiquer que quelque chose ne va pas
    console.warn('⚠️ Utilisation du rôle par défaut (student) - le profil devrait être accessible');
    return {
      role: 'student', // Rôle par défaut au lieu de null
      source: 'profiles_default',
      orgId: null,
    };
  } catch (error: any) {
    console.error('❌ Erreur inattendue dans getUserRole:', error);
    
    // En cas d'erreur, retourner un rôle par défaut plutôt que null
    // Cela permet à l'application de continuer à fonctionner
    console.warn('⚠️ Utilisation du rôle par défaut (student) en cas d\'erreur');
    return {
      role: 'student', // Rôle par défaut au lieu de null
      source: 'profiles_default',
      orgId: null,
    };
  }
}

/**
 * Récupère le rôle de l'utilisateur actuellement authentifié
 */
export async function getCurrentUserRole(): Promise<UserRoleContext> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      role: null,
      source: 'profiles_default',
      orgId: null,
    };
  }
  return getUserRole(user.id);
}

