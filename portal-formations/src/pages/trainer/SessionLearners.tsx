import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLearnersTable } from '../../lib/queries/trainerQueries';
import type { LearnerRow } from '../../types/database';
import { LearnersTable } from '../../components/trainer/LearnersTable';
import { TrainerHeader } from '../../components/trainer/TrainerHeader';
import { LearnerDetails } from '../../components/trainer/LearnerDetails';
import { AssignResourceModal } from '../../components/trainer/AssignResourceModal';

export function SessionLearners() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [learners, setLearners] = useState<LearnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLearner, setSelectedLearner] = useState<{
    userId: string;
    displayName: string;
  } | null>(null);
  const [assignResourceFor, setAssignResourceFor] = useState<{
    userId: string;
    displayName: string;
  } | null>(null);

  useEffect(() => {
    async function loadLearners() {
      if (!sessionId) return;

      setLoading(true);
      const { learners: sessionLearners, error } = await getLearnersTable(sessionId);

      if (error) {
        console.error('Error loading learners:', error);
      } else {
        setLearners(sessionLearners);
      }

      setLoading(false);
    }

    loadLearners();
  }, [sessionId]);

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
      <div className="p-6 pt-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Apprenants de la session</h1>
              <p className="mt-2 text-gray-600">Session: {sessionId}</p>
            </div>
            <button
              onClick={() => navigate('/trainer')}
              className="rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
            >
              Retour
            </button>
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
    </div>
  );
}

