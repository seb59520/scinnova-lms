import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './useAuth';
import type { OrgProgram, Program, Org } from '../types/database';

interface OrgProgramWithProgram extends OrgProgram {
  programs: Program;
}

interface OrgProgramWithOrg extends OrgProgram {
  orgs: Org;
}

interface UseOrgProgramsOptions {
  orgId?: string;
  programId?: string;
}

interface UseOrgProgramsReturn {
  // Données
  orgPrograms: OrgProgramWithProgram[];
  programOrgs: OrgProgramWithOrg[];
  availablePrograms: Program[];
  availableOrgs: Org[];

  // État
  isLoading: boolean;
  error: string | null;

  // Actions
  grantProgramToOrg: (orgId: string, programId: string) => Promise<OrgProgram | null>;
  revokeProgramFromOrg: (orgId: string, programId: string) => Promise<void>;
  toggleProgramActive: (orgProgramId: string, isActive: boolean) => Promise<void>;

  // Rafraîchissement
  refresh: () => Promise<void>;
}

export function useOrgPrograms({
  orgId,
  programId
}: UseOrgProgramsOptions = {}): UseOrgProgramsReturn {
  const { user } = useAuth();

  const [orgPrograms, setOrgPrograms] = useState<OrgProgramWithProgram[]>([]);
  const [programOrgs, setProgramOrgs] = useState<OrgProgramWithOrg[]>([]);
  const [availablePrograms, setAvailablePrograms] = useState<Program[]>([]);
  const [availableOrgs, setAvailableOrgs] = useState<Org[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Si on a un orgId, charger les programmes de cette organisation
      if (orgId) {
        const { data: orgProgramsData, error: orgProgramsError } = await supabase
          .from('org_programs')
          .select(`
            *,
            programs (*)
          `)
          .eq('org_id', orgId)
          .eq('is_active', true)
          .order('granted_at', { ascending: false });

        if (orgProgramsError) throw orgProgramsError;
        setOrgPrograms(orgProgramsData || []);

        // Charger les programmes disponibles (non encore associés)
        const assignedProgramIds = (orgProgramsData || []).map(op => op.program_id);

        let availableQuery = supabase
          .from('programs')
          .select('*')
          .eq('status', 'published');

        if (assignedProgramIds.length > 0) {
          availableQuery = availableQuery.not('id', 'in', `(${assignedProgramIds.join(',')})`);
        }

        const { data: availableProgramsData, error: availableProgramsError } = await availableQuery;
        if (availableProgramsError) throw availableProgramsError;
        setAvailablePrograms(availableProgramsData || []);
      }

      // Si on a un programId, charger les organisations de ce programme
      if (programId) {
        const { data: programOrgsData, error: programOrgsError } = await supabase
          .from('org_programs')
          .select(`
            *,
            orgs (*)
          `)
          .eq('program_id', programId)
          .eq('is_active', true)
          .order('granted_at', { ascending: false });

        if (programOrgsError) throw programOrgsError;
        setProgramOrgs(programOrgsData || []);

        // Charger les organisations disponibles (non encore associées)
        const assignedOrgIds = (programOrgsData || []).map(po => po.org_id);

        let availableOrgsQuery = supabase
          .from('orgs')
          .select('*');

        if (assignedOrgIds.length > 0) {
          availableOrgsQuery = availableOrgsQuery.not('id', 'in', `(${assignedOrgIds.join(',')})`);
        }

        const { data: availableOrgsData, error: availableOrgsError } = await availableOrgsQuery;
        if (availableOrgsError) throw availableOrgsError;
        setAvailableOrgs(availableOrgsData || []);
      }
    } catch (err) {
      console.error('Error loading org programs:', err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  }, [user, orgId, programId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Associer un programme à une organisation
  const grantProgramToOrg = async (targetOrgId: string, targetProgramId: string): Promise<OrgProgram | null> => {
    try {
      const { data, error: insertError } = await supabase
        .from('org_programs')
        .insert({
          org_id: targetOrgId,
          program_id: targetProgramId,
          granted_by: user?.id,
          is_active: true
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await loadData();
      return data;
    } catch (err) {
      console.error('Error granting program to org:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'association');
      return null;
    }
  };

  // Révoquer un programme d'une organisation
  const revokeProgramFromOrg = async (targetOrgId: string, targetProgramId: string): Promise<void> => {
    try {
      const { error: updateError } = await supabase
        .from('org_programs')
        .update({ is_active: false })
        .eq('org_id', targetOrgId)
        .eq('program_id', targetProgramId);

      if (updateError) throw updateError;

      await loadData();
    } catch (err) {
      console.error('Error revoking program from org:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la révocation');
      throw err;
    }
  };

  // Activer/désactiver une liaison
  const toggleProgramActive = async (orgProgramId: string, isActive: boolean): Promise<void> => {
    try {
      const { error: updateError } = await supabase
        .from('org_programs')
        .update({ is_active: isActive })
        .eq('id', orgProgramId);

      if (updateError) throw updateError;

      await loadData();
    } catch (err) {
      console.error('Error toggling org program:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
      throw err;
    }
  };

  return {
    orgPrograms,
    programOrgs,
    availablePrograms,
    availableOrgs,
    isLoading,
    error,
    grantProgramToOrg,
    revokeProgramFromOrg,
    toggleProgramActive,
    refresh: loadData
  };
}
