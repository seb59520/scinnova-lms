import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import {
  FileText,
  Plus,
  Trash2,
  Search,
  X,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  BookOpen,
  ClipboardCheck,
  Gamepad2,
  AlertCircle,
  Users
} from 'lucide-react';

interface ProgramExpectedItem {
  id: string;
  program_id: string;
  item_id: string;
  item_type: 'quiz' | 'tp' | 'exercise' | 'game';
  is_required: boolean;
  due_date: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  items?: {
    id: string;
    title: string;
    type: string;
    modules?: {
      id: string;
      title: string;
      courses?: {
        id: string;
        title: string;
      };
    };
  };
}

interface ProgramExpectedItemsManagerProps {
  programId: string;
}

export function ProgramExpectedItemsManager({ programId }: ProgramExpectedItemsManagerProps) {
  const { user, profile } = useAuth();
  const [expectedItems, setExpectedItems] = useState<ProgramExpectedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'quiz' | 'tp' | 'exercise' | 'game'>('all');
  const [itemSubmissions, setItemSubmissions] = useState<Record<string, any[]>>({});
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  useEffect(() => {
    fetchExpectedItems();
  }, [programId]);

  // Charger les soumissions pour les TP de contrôle
  useEffect(() => {
    if (profile && expectedItems.length > 0) {
      const isTrainerOrAdmin = profile.role === 'admin' || profile.role === 'trainer' || profile.role === 'instructor';
      if (isTrainerOrAdmin) {
        const controlTpItems = expectedItems.filter((ei: any) => 
          ei.items?.type === 'tp' && ei.items?.is_control_tp === true
        );
        if (controlTpItems.length > 0) {
          const itemIds = controlTpItems.map((ei: any) => ei.items.id).filter(Boolean);
          fetchSubmissionsForItems(itemIds);
        }
      }
    }
  }, [profile, expectedItems]);

  const fetchSubmissionsForItems = async (itemIds: string[]) => {
    if (itemIds.length === 0) return;

    try {
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('submissions')
        .select(`
          *,
          profiles (
            id,
            full_name,
            student_id
          )
        `)
        .in('item_id', itemIds)
        .order('submitted_at', { ascending: false });

      if (submissionsError) {
        console.error('Error fetching submissions:', submissionsError);
        return;
      }

      // Grouper les soumissions par item_id
      const submissionsByItem: Record<string, any[]> = {};
      submissionsData?.forEach((sub: any) => {
        if (!submissionsByItem[sub.item_id]) {
          submissionsByItem[sub.item_id] = [];
        }
        submissionsByItem[sub.item_id].push(sub);
      });

      setItemSubmissions(submissionsByItem);
    } catch (err) {
      console.error('Error fetching submissions for items:', err);
    }
  };

  const fetchExpectedItems = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Récupération des items attendus pour le programme:', programId);
      
      const { data, error: fetchError } = await supabase
        .from('program_expected_items')
        .select('*')
        .eq('program_id', programId)
        .order('position', { ascending: true });

      console.log('📊 Résultat de la requête:', { data, error: fetchError });

      if (fetchError) {
        console.error('❌ Erreur lors de la récupération:', fetchError);
        // Si la table n'existe pas, afficher un message clair
        if (fetchError.message?.includes('does not exist') || fetchError.code === '42P01' || fetchError.message?.includes('relation') || fetchError.message?.includes('permission denied')) {
          if (fetchError.message?.includes('permission denied') || fetchError.code === '42501') {
            setError('Permission refusée. Vérifiez que vous êtes connecté en tant qu\'admin ou trainer et que les politiques RLS sont correctement configurées.');
          } else {
            setError('La table program_expected_items n\'existe pas encore. Veuillez appliquer la migration SQL 20260123_program_expected_items.sql');
          }
          console.error('Table program_expected_items n\'existe pas ou permission refusée:', fetchError);
          setExpectedItems([]);
          return;
        }
        throw fetchError;
      }

      console.log('✅ Items attendus trouvés:', data?.length || 0);

      // Récupérer les détails des items séparément
      if (data && data.length > 0) {
        console.log('📦 Enrichissement des données pour', data.length, 'items');
        const itemIds = data.map(ei => ei.item_id);
        const { data: itemsData, error: itemsError } = await supabase
          .from('items')
          .select('id, title, type, module_id, is_control_tp')
          .in('id', itemIds);

        if (itemsError) throw itemsError;

        // Récupérer les modules
        const moduleIds = [...new Set((itemsData || []).map(i => i.module_id).filter(Boolean))];
        let modulesMap = new Map();
        if (moduleIds.length > 0) {
          const { data: modulesData } = await supabase
            .from('modules')
            .select('id, title, course_id')
            .in('id', moduleIds);

          if (modulesData) {
            modulesMap = new Map(modulesData.map(m => [m.id, m]));
          }
        }

        // Récupérer les cours
        const courseIds = [...new Set(Array.from(modulesMap.values()).map((m: any) => m.course_id).filter(Boolean))];
        let coursesMap = new Map();
        if (courseIds.length > 0) {
          const { data: coursesData } = await supabase
            .from('courses')
            .select('id, title')
            .in('id', courseIds);

          if (coursesData) {
            coursesMap = new Map(coursesData.map(c => [c.id, c]));
          }
        }

        // Enrichir les données
        const enriched = data.map(ei => {
          const item = (itemsData || []).find(i => i.id === ei.item_id);
          const module = item?.module_id ? modulesMap.get(item.module_id) : null;
          const course = module?.course_id ? coursesMap.get(module.course_id) : null;

          return {
            ...ei,
            items: item ? {
              id: item.id,
              title: item.title,
              type: item.type,
              is_control_tp: item.is_control_tp,
              modules: module ? {
                id: module.id,
                title: module.title,
                courses: course ? {
                  id: course.id,
                  title: course.title
                } : null
              } : null
            } : null
          };
        });

        console.log('✅ Items enrichis:', enriched.length);
        setExpectedItems(enriched);
      } else {
        console.log('ℹ️ Aucun item attendu trouvé pour ce programme');
        setExpectedItems([]);
      }
    } catch (err: any) {
      console.error('❌ Error fetching expected items:', err);
      const errorMessage = err.message || 'Erreur lors du chargement des items attendus';
      
      // Messages d'erreur plus spécifiques
      if (err.message?.includes('permission denied') || err.code === '42501') {
        setError('Permission refusée. Vérifiez que vous êtes connecté en tant qu\'admin ou trainer.');
      } else if (err.message?.includes('does not exist') || err.code === '42P01' || err.message?.includes('relation')) {
        setError('La table program_expected_items n\'existe pas encore. Veuillez appliquer la migration SQL 20260123_program_expected_items.sql');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableItems = async () => {
    try {
      setLoadingItems(true);
      
      // Récupérer les cours du programme
      const { data: programCourses, error: pcError } = await supabase
        .from('program_courses')
        .select('course_id')
        .eq('program_id', programId);

      if (pcError) throw pcError;

      const courseIds = (programCourses || []).map(pc => pc.course_id);
      if (courseIds.length === 0) {
        setAvailableItems([]);
        setLoadingItems(false);
        return;
      }

      // Récupérer les modules de ces cours
      const { data: modules, error: modulesError } = await supabase
        .from('modules')
        .select('id, course_id')
        .in('course_id', courseIds);

      if (modulesError) throw modulesError;

      const moduleIds = (modules || []).map(m => m.id);
      if (moduleIds.length === 0) {
        setAvailableItems([]);
        setLoadingItems(false);
        return;
      }

      // Récupérer les items (quiz, TP, exercices, jeux) de ces modules
      const typeFilter = filterType === 'all' 
        ? ['exercise', 'tp', 'game'] 
        : filterType === 'quiz' 
          ? ['game'] // Les quiz sont des items de type 'game' avec gameType: 'quiz'
          : [filterType];

      const { data: items, error: itemsError } = await supabase
        .from('items')
        .select('id, title, type, module_id')
        .in('module_id', moduleIds)
        .in('type', typeFilter)
        .eq('published', true)
        .order('title', { ascending: true });

      if (itemsError) throw itemsError;

      // Récupérer les modules et cours pour enrichir les données
      const moduleIdsForItems = [...new Set((items || []).map(i => i.module_id).filter(Boolean))];
      let modulesMap = new Map();
      if (moduleIdsForItems.length > 0) {
        const { data: modulesData } = await supabase
          .from('modules')
          .select('id, title, course_id')
          .in('id', moduleIdsForItems);

        if (modulesData) {
          modulesMap = new Map(modulesData.map(m => [m.id, m]));
        }
      }

      const courseIdsForItems = [...new Set(Array.from(modulesMap.values()).map((m: any) => m.course_id).filter(Boolean))];
      let coursesMap = new Map();
      if (courseIdsForItems.length > 0) {
        const { data: coursesData } = await supabase
          .from('courses')
          .select('id, title')
          .in('id', courseIdsForItems);

        if (coursesData) {
          coursesMap = new Map(coursesData.map(c => [c.id, c]));
        }
      }

      // Enrichir les items avec leurs modules et cours
      const enrichedItems = (items || []).map(item => {
        const module = item.module_id ? modulesMap.get(item.module_id) : null;
        const course = module?.course_id ? coursesMap.get(module.course_id) : null;

        return {
          ...item,
          modules: module ? {
            id: module.id,
            title: module.title,
            courses: course ? {
              id: course.id,
              title: course.title
            } : null
          } : null
        };
      });

      // Filtrer les items déjà ajoutés
      const existingItemIds = new Set(expectedItems.map(ei => ei.item_id));
      const filtered = enrichedItems.filter(item => !existingItemIds.has(item.id));

      setAvailableItems(filtered);
    } catch (err) {
      console.error('Error fetching available items:', err);
      setError('Erreur lors du chargement des items disponibles');
    } finally {
      setLoadingItems(false);
    }
  };

  const handleAddItems = async () => {
    if (selectedItemIds.length === 0) {
      setError('Veuillez sélectionner au moins un item');
      return;
    }

    try {
      console.log('➕ Ajout de', selectedItemIds.length, 'items au programme', programId);
      
      // Déterminer le type de chaque item
      const itemsToAdd = selectedItemIds.map(itemId => {
        const item = availableItems.find(i => i.id === itemId);
        let itemType: 'quiz' | 'tp' | 'exercise' | 'game' = 'exercise';
        
        if (item?.type === 'tp') {
          itemType = 'tp';
        } else if (item?.type === 'game') {
          // Vérifier si c'est un quiz (gameType: 'quiz' dans content)
          itemType = 'quiz';
        } else if (item?.type === 'exercise') {
          itemType = 'exercise';
        }

        const itemData = {
          program_id: programId,
          item_id: itemId,
          item_type: itemType,
          is_required: true,
          position: expectedItems.length + selectedItemIds.indexOf(itemId)
        };
        
        console.log('📝 Item à ajouter:', itemData);
        return itemData;
      });

      console.log('💾 Insertion dans program_expected_items:', itemsToAdd);
      const { data: insertedData, error: insertError } = await supabase
        .from('program_expected_items')
        .insert(itemsToAdd)
        .select();

      if (insertError) {
        console.error('❌ Erreur lors de l\'insertion:', insertError);
        throw insertError;
      }

      console.log('✅ Items ajoutés avec succès:', insertedData);
      setShowAddModal(false);
      setSelectedItemIds([]);
      await fetchExpectedItems();
    } catch (err: any) {
      console.error('❌ Error adding expected items:', err);
      const errorMessage = err.message || 'Erreur lors de l\'ajout des items';
      setError(errorMessage);
      
      // Afficher un message plus détaillé selon le type d'erreur
      if (err.message?.includes('permission denied') || err.code === '42501') {
        setError('Permission refusée. Vérifiez que vous êtes connecté en tant qu\'admin ou trainer et que les politiques RLS sont correctement configurées.');
      } else if (err.message?.includes('does not exist') || err.code === '42P01') {
        setError('La table program_expected_items n\'existe pas encore. Veuillez appliquer la migration SQL.');
      } else {
        setError(errorMessage);
      }
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm('Retirer cet item de la liste des items attendus ?')) return;

    try {
      const { error } = await supabase
        .from('program_expected_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      await fetchExpectedItems();
    } catch (err: any) {
      console.error('Error removing item:', err);
      setError(err.message || 'Erreur lors de la suppression');
    }
  };

  const handleToggleRequired = async (itemId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('program_expected_items')
        .update({ is_required: !currentValue })
        .eq('id', itemId);

      if (error) throw error;
      await fetchExpectedItems();
    } catch (err: any) {
      console.error('Error toggling required:', err);
      setError(err.message || 'Erreur lors de la mise à jour');
    }
  };

  const getItemTypeIcon = (type: string) => {
    switch (type) {
      case 'quiz':
      case 'game':
        return <Gamepad2 className="w-4 h-4" />;
      case 'tp':
        return <ClipboardCheck className="w-4 h-4" />;
      case 'exercise':
        return <BookOpen className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getItemTypeColor = (type: string) => {
    switch (type) {
      case 'quiz':
        return 'bg-purple-100 text-purple-700';
      case 'tp':
        return 'bg-blue-100 text-blue-700';
      case 'exercise':
        return 'bg-yellow-100 text-yellow-700';
      case 'game':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case 'quiz':
        return 'Quiz';
      case 'tp':
        return 'TP';
      case 'exercise':
        return 'Exercice';
      case 'game':
        return 'Jeu';
      default:
        return type;
    }
  };

  const filteredExpectedItems = expectedItems.filter(item => {
    if (!searchTerm) return true;
    const matchesSearch = item.items?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.items?.modules?.courses?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredAvailableItems = availableItems.filter(item => {
    if (!searchTerm) return true;
    const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.modules?.courses?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Chargement...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-orange-600" />
          <h3 className="font-semibold text-gray-900">Quiz, TP et Examens attendus</h3>
          <span className="text-sm text-gray-500">({expectedItems.length})</span>
        </div>
        <button
          onClick={() => {
            setShowAddModal(true);
            fetchAvailableItems();
          }}
          className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
        >
          <Plus className="w-4 h-4" />
          Ajouter des items
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-sm border-b border-red-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium mb-1">Erreur</p>
              <p>{error}</p>
              {error.includes('migration') && (
                <div className="mt-2 p-2 bg-red-100 rounded text-xs">
                  <p className="font-medium mb-1">Pour résoudre ce problème :</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Ouvrez l'interface SQL de Supabase</li>
                    <li>Copiez le contenu du fichier <code className="bg-red-200 px-1 rounded">supabase/migrations/20260123_program_expected_items.sql</code></li>
                    <li>Exécutez la migration dans l'éditeur SQL</li>
                  </ol>
                </div>
              )}
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Barre de recherche */}
      {expectedItems.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher un item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
      )}

      {/* Liste des items attendus */}
      <div className="divide-y divide-gray-200">
        {expectedItems.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <ClipboardCheck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Aucun item attendu pour ce programme</p>
            <p className="text-sm mt-1">
              Ajoutez des quiz, TP ou exercices que les apprenants doivent compléter
            </p>
          </div>
        ) : (
          filteredExpectedItems.map((expectedItem) => (
            <div
              key={expectedItem.id}
              className="p-4 hover:bg-gray-50"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {getItemTypeIcon(expectedItem.item_type)}
                    <h4 className="font-medium text-gray-900">
                      {expectedItem.items?.title || 'Item inconnu'}
                    </h4>
                    <span className={`text-xs px-2 py-0.5 rounded ${getItemTypeColor(expectedItem.item_type)}`}>
                      {getItemTypeLabel(expectedItem.item_type)}
                    </span>
                    {expectedItem.is_required && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                        Obligatoire
                      </span>
                    )}
                  </div>
                  {expectedItem.items?.modules?.courses && (
                    <p className="text-sm text-gray-500 mt-1">
                      Cours: {expectedItem.items.modules.courses.title}
                      {expectedItem.items.modules.title && ` • Module: ${expectedItem.items.modules.title}`}
                    </p>
                  )}
                  {expectedItem.due_date && (
                    <p className="text-xs text-gray-400 mt-1">
                      Échéance: {new Date(expectedItem.due_date).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {expectedItem.items?.id && (
                    <Link
                      to={`/items/${expectedItem.items.id}`}
                      className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                    >
                      Accéder
                    </Link>
                  )}
                  {/* Pour les TP de contrôle, afficher un bouton pour voir les soumissions */}
                  {expectedItem.items?.type === 'tp' && expectedItem.items?.is_control_tp === true && (
                    <button
                      onClick={() => setExpandedItemId(expandedItemId === expectedItem.items.id ? null : expectedItem.items.id)}
                      className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm font-medium flex items-center gap-2"
                    >
                      <Users className="w-4 h-4" />
                      Voir les soumissions ({itemSubmissions[expectedItem.items.id]?.length || 0})
                    </button>
                  )}
                  <button
                    onClick={() => handleToggleRequired(expectedItem.id, expectedItem.is_required)}
                    className={`p-1.5 rounded ${
                      expectedItem.is_required
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                    title={expectedItem.is_required ? 'Rendre optionnel' : 'Rendre obligatoire'}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRemoveItem(expectedItem.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                    title="Retirer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {/* Liste des soumissions (pour TP de contrôle) */}
              {expandedItemId === expectedItem.items?.id && 
               expectedItem.items?.type === 'tp' && 
               expectedItem.items?.is_control_tp === true && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Soumissions des étudiants</h5>
                  {!itemSubmissions[expectedItem.items.id] || itemSubmissions[expectedItem.items.id].length === 0 ? (
                    <p className="text-sm text-gray-500 italic">Aucune soumission pour le moment</p>
                  ) : (
                    <div className="space-y-2">
                      {itemSubmissions[expectedItem.items.id].map((submission: any) => (
                        <div
                          key={submission.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {submission.profiles?.full_name || submission.profiles?.student_id || 'Étudiant inconnu'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                submission.status === 'graded'
                                  ? 'bg-green-100 text-green-700'
                                  : submission.status === 'submitted'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {submission.status === 'graded' ? 'Noté' : submission.status === 'submitted' ? 'Soumis' : 'Brouillon'}
                              </span>
                              {submission.grade !== null && (
                                <span className="text-xs font-medium text-gray-700">
                                  Note: {submission.grade}/20
                                </span>
                              )}
                              <span className="text-xs text-gray-500">
                                {new Date(submission.submitted_at).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          </div>
                          <Link
                            to={`/items/${expectedItem.items.id}?userId=${submission.user_id}`}
                            className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm font-medium"
                          >
                            Noter
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal d'ajout */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Ajouter des items attendus</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedItemIds([]);
                  setSearchTerm('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filtre par type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrer par type
              </label>
              <div className="flex gap-2">
                {(['all', 'quiz', 'tp', 'exercise'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setFilterType(type);
                      fetchAvailableItems();
                    }}
                    className={`px-3 py-1.5 rounded text-sm ${
                      filterType === type
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type === 'all' ? 'Tous' : type === 'quiz' ? 'Quiz' : type === 'tp' ? 'TP' : 'Exercices'}
                  </button>
                ))}
              </div>
            </div>

            {/* Barre de recherche */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher un item..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Liste des items disponibles */}
            <div className="flex-1 overflow-y-auto mb-4 border border-gray-200 rounded-lg">
              {loadingItems ? (
                <div className="p-8 text-center text-gray-500">Chargement...</div>
              ) : filteredAvailableItems.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  {searchTerm ? 'Aucun item trouvé' : 'Aucun item disponible'}
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredAvailableItems.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedItemIds.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItemIds([...selectedItemIds, item.id]);
                          } else {
                            setSelectedItemIds(selectedItemIds.filter(id => id !== item.id));
                          }
                        }}
                        className="mt-1 h-4 w-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {getItemTypeIcon(item.type === 'game' ? 'quiz' : item.type)}
                          <span className="font-medium text-gray-900">{item.title}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${getItemTypeColor(item.type === 'game' ? 'quiz' : item.type)}`}>
                            {getItemTypeLabel(item.type === 'game' ? 'quiz' : item.type)}
                          </span>
                        </div>
                        {item.modules?.courses && (
                          <p className="text-xs text-gray-500 mt-1">
                            {item.modules.courses.title}
                            {item.modules.title && ` • ${item.modules.title}`}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Boutons */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedItemIds([]);
                  setSearchTerm('');
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleAddItems}
                disabled={selectedItemIds.length === 0}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ajouter {selectedItemIds.length} item{selectedItemIds.length > 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
