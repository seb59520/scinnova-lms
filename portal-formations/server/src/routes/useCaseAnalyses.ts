import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

// Créer un client Supabase pour le serveur
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('⚠️ Variables d\'environnement Supabase manquantes pour l\'API');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/use-case-analyses
 * Sauvegarde une analyse IA d'un cas d'usage
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      useCaseId,
      useCaseTitle,
      useCaseData,
      analysis,
      appliedSuggestions,
      userId, // L'ID utilisateur sera passé depuis l'application
    } = req.body;

    // Pour l'instant, on accepte userId dans le body
    // TODO: Implémenter une authentification plus sécurisée (JWT, session, etc.)
    if (!userId) {
      return res.status(401).json({ error: 'User ID requis' });
    }

    // Vérifier les données requises
    if (!useCaseId || !useCaseTitle || !useCaseData || !analysis) {
      return res.status(400).json({
        error: 'Données manquantes',
        required: ['useCaseId', 'useCaseTitle', 'useCaseData', 'analysis'],
      });
    }

    // Insérer ou mettre à jour l'analyse
    const { data, error } = await supabase
      .from('use_case_analyses')
      .upsert(
        {
          user_id: userId,
          use_case_id: useCaseId,
          use_case_title: useCaseTitle,
          use_case_data: useCaseData,
          analysis: analysis,
          applied_suggestions: appliedSuggestions || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,use_case_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Erreur Supabase:', error);
      return res.status(500).json({ error: 'Erreur lors de la sauvegarde', details: error.message });
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Erreur API:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue',
    });
  }
});

/**
 * PATCH /api/use-case-analyses/:useCaseId
 * Met à jour les suggestions appliquées
 */
router.patch('/:useCaseId', async (req: Request, res: Response) => {
  try {
    const { useCaseId } = req.params;
    const { appliedSuggestions, userId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User ID requis' });
    }

    // Mettre à jour l'analyse
    const { data, error } = await supabase
      .from('use_case_analyses')
      .update({
        applied_suggestions: appliedSuggestions,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('use_case_id', useCaseId)
      .select()
      .single();

    if (error) {
      console.error('Erreur Supabase:', error);
      return res.status(500).json({ error: 'Erreur lors de la mise à jour', details: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Analyse non trouvée' });
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Erreur API:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue',
    });
  }
});

export default router;
