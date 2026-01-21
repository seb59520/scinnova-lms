import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLearnersTable } from '../../lib/queries/trainerQueries';
import type { LearnerRow } from '../../types/database';
import { LearnersTable } from '../../components/trainer/LearnersTable';
import { TrainerHeader } from '../../components/trainer/TrainerHeader';
import { LearnerDetails } from '../../components/trainer/LearnerDetails';
import { AssignResourceModal } from '../../components/trainer/AssignResourceModal';
import { supabase } from '../../lib/supabaseClient';
import { UserPlus, Search, User, X } from 'lucide-react';

export function SessionLearners() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [learners, setLearners] = useState<LearnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionTitle, setSessionTitle] = useState<string>('');
  const [selectedLearner, setSelectedLearner] = useState<{
    userId: string;
    displayName: string;
  } | null>(null);
  const [assignResourceFor, setAssignResourceFor] = useState<{
    userId: string;
    displayName: string;
  } | null>(null);

  // État pour le modal d'ajout d'apprenants
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!sessionId) return;

      setLoading(true);
      
      // Charger le nom de la session
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('title')
        .eq('id', sessionId)
        .single();
      
      if (sessionData) {
        setSessionTitle(sessionData.title);
      }
      
      // Charger les apprenants
      const { learners: sessionLearners, error } = await getLearnersTable(sessionId);

      if (error) {
        console.error('Error loading learners:', error);
      } else {
        setLearners(sessionLearners);
      }

      setLoading(false);
    }

    loadData();
  }, [sessionId]);

  // Charger les utilisateurs disponibles pour l'ajout
  const loadAvailableUsers = async () => {
    if (!sessionId) return;
    setLoadingUsers(true);
    try {
      // Charger les membres existants directement depuis session_members
      const { data: existingMembers } = await supabase
        .from('session_members')
        .select('user_id')
        .eq('session_id', sessionId);
      
      const existingUserIds = (existingMembers || []).map(m => m.user_id);
      
      // Charger tous les profils
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .order('full_name');

      if (!error && data) {
        const filtered = data.filter(u => !existingUserIds.includes(u.id));
        setAvailableUsers(filtered);
      }
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleOpenAddModal = () => {
    setShowAddModal(true);
    setSelectedUsers([]);
    setSearchQuery('');
    loadAvailableUsers();
  };

  const handleAddLearners = async () => {
    if (selectedUsers.length === 0 || !sessionId) return;
    setAdding(true);

    try {
      const membersToAdd = selectedUsers.map(userId => ({
        session_id: sessionId,
        user_id: userId,
        role: 'learner',
        status: 'enrolled'
      }));

      const { error } = await supabase
        .from('session_members')
        .insert(membersToAdd);

      if (error) throw error;

      setShowAddModal(false);
      setSelectedUsers([]);
      
      // Recharger les apprenants
      const { learners: updatedLearners } = await getLearnersTable(sessionId);
      setLearners(updatedLearners);
    } catch (err) {
      console.error('Error adding learners:', err);
      alert('Erreur lors de l\'ajout des apprenants');
    } finally {
      setAdding(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const filteredUsers = availableUsers.filter(u => 
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function handleRelance(userId: string) {
    // TODO: Implémenter la relance (email, notification, etc.)
    alert(`Relance pour l'apprenant ${userId} (à implémenter)`);
  }

  function handleAssignResource(userId: string) {
    const learner = learners.find((l) => l.user_id === userId);
    if (learner) {
      setAssignResourceFor({
        userId,
        displayName: learner.display_name,
      });
    }
  }

  function handleCloseAssignResource() {
    setAssignResourceFor(null);
  }

  function handleResourceAssigned() {
    // Recharger la liste des apprenants pour mettre à jour les notifications
    if (sessionId) {
      getLearnersTable(sessionId).then(({ learners: sessionLearners }) => {
        setLearners(sessionLearners);
      });
    }
  }

  function handleAddNote(userId: string) {
    // Rediriger vers la page de notes avec filtre
    navigate(`/trainer/notes?user_id=${userId}&session_id=${sessionId}`);
  }

  function handleViewDetails(userId: string, displayName: string) {
    console.log('🔍 handleViewDetails appelé:', { userId, displayName, sessionId });
    setSelectedLearner({ userId, displayName });
  }

  function handleCloseDetails() {
    setSelectedLearner(null);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TrainerHeader />
      <div className="p-6 pt-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Apprenants de la session</h1>
              <p className="mt-2 text-gray-600">
                {sessionTitle || 'Chargement...'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
              >
                <UserPlus className="h-5 w-5" />
                Ajouter des apprenants
              </button>
              <button
                onClick={() => navigate(-1)}
                className="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
              >
                Retour
              </button>
            </div>
          </div>

          <LearnersTable
            learners={learners}
            loading={loading}
            onRelance={handleRelance}
            onAssignResource={handleAssignResource}
            onAddNote={handleAddNote}
            onViewDetails={handleViewDetails}
          />
        </div>
      </div>

      {/* Modal des détails de l'apprenant */}
      {selectedLearner && sessionId && (
        <LearnerDetails
          sessionId={sessionId}
          userId={selectedLearner.userId}
          displayName={selectedLearner.displayName}
          onClose={handleCloseDetails}
        />
      )}

      {/* Modal d'assignation de ressource */}
      {assignResourceFor && sessionId && (
        <AssignResourceModal
          learnerId={assignResourceFor.userId}
          learnerName={assignResourceFor.displayName}
          sessionId={sessionId}
          onClose={handleCloseAssignResource}
          onSuccess={handleResourceAssigned}
        />
      )}

      {/* Modal d'ajout d'apprenants */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Ajouter des apprenants</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Recherche */}
              <div className="mt-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un utilisateur..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loadingUsers ? (
                <div className="text-center py-8 text-gray-500">
                  Chargement des utilisateurs...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? 'Aucun utilisateur trouvé' : 'Tous les utilisateurs sont déjà inscrits'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredUsers.map(user => (
                    <label
                      key={user.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedUsers.includes(user.id)
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">
                          {user.full_name || 'Utilisateur sans nom'}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          ({user.role})
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {selectedUsers.length} utilisateur(s) sélectionné(s)
                </span>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAddLearners}
                    disabled={selectedUsers.length === 0 || adding}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {adding ? (
                      <>Ajout en cours...</>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Ajouter ({selectedUsers.length})
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

