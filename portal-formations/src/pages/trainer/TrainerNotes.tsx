import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getTrainerContext, getTrainerNotes, createTrainerNote, updateTrainerNote, deleteTrainerNote, getSessions } from '../../lib/queries/trainerQueries';
import type { TrainerNote } from '../../types/database';
import { TrainerHeader } from '../../components/trainer/TrainerHeader';
import { formatRelativeDate } from '../../utils/trainerUtils';
import { supabase } from '../../lib/supabaseClient';

// Types pour les lookups
interface CourseLookup {
  id: string;
  title: string;
}

interface ModuleLookup {
  id: string;
  title: string;
  course_id: string;
}

interface SessionLookup {
  id: string;
  title: string;
  course_id: string;
}

interface UserLookup {
  id: string;
  display_name: string;
}

export function TrainerNotes() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [org, setOrg] = useState<any>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [notes, setNotes] = useState<TrainerNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState<TrainerNote | null>(null);
  const [filters, setFilters] = useState({
    course_id: searchParams.get('course_id') || '',
    module_id: searchParams.get('module_id') || '',
    session_id: searchParams.get('session_id') || '',
    user_id: searchParams.get('user_id') || '',
  });

  // Lookups pour afficher les titres/noms
  const [courses, setCourses] = useState<CourseLookup[]>([]);
  const [modules, setModules] = useState<ModuleLookup[]>([]);
  const [sessions, setSessions] = useState<SessionLookup[]>([]);
  const [users, setUsers] = useState<UserLookup[]>([]);

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      setLoading(true);

      const { org: trainerOrg, role, error: contextError } = await getTrainerContext();
      
      // Pour les admins, l'org peut être null - on continue quand même
      const isAdmin = role === 'admin';
      if (contextError && !isAdmin) {
        console.error('Error loading trainer context:', contextError);
        setLoading(false);
        return;
      }
      
      // Si pas d'org mais admin, on utilise un org fictif pour les requêtes
      const effectiveOrgId = trainerOrg?.id || '';
      setOrg(trainerOrg);
      setIsAdminUser(isAdmin);

      // Charger les lookups en parallèle
      await Promise.all([
        loadCourses(effectiveOrgId, isAdmin),
        loadSessions(effectiveOrgId, isAdmin),
        loadUsers(effectiveOrgId, isAdmin),
        loadNotes(effectiveOrgId, user.id, isAdmin),
      ]);

      setLoading(false);
    }

    loadData();
  }, [user]);

  async function loadCourses(orgId: string, isAdmin: boolean) {
    let query = supabase.from('courses').select('id, title').order('title');
    if (!isAdmin) {
      query = query.eq('org_id', orgId);
    }
    const { data } = await query;
    setCourses(data || []);

    // Charger les modules pour tous les cours
    const courseIds = data?.map(c => c.id) || [];
    if (courseIds.length > 0) {
      const { data: modulesData } = await supabase
        .from('modules')
        .select('id, title, course_id')
        .in('course_id', courseIds)
        .order('order_index');
      setModules(modulesData || []);
    }
  }

  async function loadSessions(orgId: string, isAdmin: boolean) {
    const { sessions: sessionData } = await getSessions(orgId, isAdmin);
    setSessions(sessionData.map(s => ({ id: s.id, title: s.title, course_id: s.course_id })));
  }

  async function loadUsers(orgId: string, isAdmin: boolean) {
    // Récupérer les utilisateurs de l'organisation avec leurs noms
    let query = supabase
      .from('org_members')
      .select('user_id, display_name, profiles!inner(id, full_name)');
    
    if (!isAdmin) {
      query = query.eq('org_id', orgId);
    }
    
    const { data } = await query;
    
    const userList: UserLookup[] = (data || []).map((m: any) => ({
      id: m.user_id,
      display_name: m.display_name || m.profiles?.full_name || 'Utilisateur inconnu',
    }));
    
    // Dédupliquer par id
    const uniqueUsers = Array.from(
      new Map(userList.map(u => [u.id, u])).values()
    );
    setUsers(uniqueUsers);
  }

  async function loadNotes(orgId: string, trainerId: string, isAdmin: boolean = false) {
    const activeFilters: any = {};
    if (filters.course_id) activeFilters.course_id = filters.course_id;
    if (filters.module_id) activeFilters.module_id = filters.module_id;
    if (filters.session_id) activeFilters.session_id = filters.session_id;
    if (filters.user_id) activeFilters.user_id = filters.user_id;

    // Pour les admins sans org, charger directement depuis Supabase sans filtrer par org
    if (isAdmin && !orgId) {
      try {
        let query = supabase
          .from('trainer_notes')
          .select('*')
          .eq('trainer_id', trainerId)
          .order('created_at', { ascending: false });
        
        if (activeFilters.course_id) query = query.eq('course_id', activeFilters.course_id);
        if (activeFilters.module_id) query = query.eq('module_id', activeFilters.module_id);
        if (activeFilters.session_id) query = query.eq('session_id', activeFilters.session_id);
        if (activeFilters.user_id) query = query.eq('user_id', activeFilters.user_id);
        
        const { data, error } = await query;
        if (error) {
          console.error('Error loading notes:', error);
        } else {
          setNotes(data || []);
        }
      } catch (err) {
        console.error('Error loading notes:', err);
      }
    } else {
      const { notes: trainerNotes, error } = await getTrainerNotes(trainerId, orgId, activeFilters);
      if (error) {
        console.error('Error loading notes:', error);
      } else {
        setNotes(trainerNotes);
      }
    }
  }

  useEffect(() => {
    if (user && (org || isAdminUser)) {
      loadNotes(org?.id || '', user.id, isAdminUser);
    }
  }, [filters, org, user, isAdminUser]);

  function handleCreate() {
    setEditingNote(null);
    setShowModal(true);
  }

  function handleEdit(note: TrainerNote) {
    setEditingNote(note);
    setShowModal(true);
  }

  async function handleSave(formData: FormData) {
    if (!user || !org) return;

    const noteData = {
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      tags: formData.get('tags') ? (formData.get('tags') as string).split(',').map(t => t.trim()) : [],
      course_id: formData.get('course_id') || null,
      module_id: formData.get('module_id') || null,
      session_id: formData.get('session_id') || null,
      user_id: formData.get('user_id') || null,
      is_private: formData.get('is_private') === 'on',
    };

    if (editingNote) {
      const { error } = await updateTrainerNote(editingNote.id, {
        title: noteData.title || null,
        content: noteData.content,
        tags: noteData.tags.length > 0 ? noteData.tags : null,
        course_id: noteData.course_id as string | null,
        module_id: noteData.module_id as string | null,
        session_id: noteData.session_id as string | null,
        user_id: noteData.user_id as string | null,
        is_private: noteData.is_private,
      });
      if (error) {
        alert('Erreur lors de la mise à jour: ' + error.message);
      } else {
        setShowModal(false);
        await loadNotes(org.id, user.id);
      }
    } else {
      const { error } = await createTrainerNote({
        trainer_id: user.id,
        org_id: org.id,
        title: noteData.title || null,
        content: noteData.content,
        tags: noteData.tags.length > 0 ? noteData.tags : null,
        course_id: noteData.course_id as string | null,
        module_id: noteData.module_id as string | null,
        session_id: noteData.session_id as string | null,
        user_id: noteData.user_id as string | null,
        is_private: noteData.is_private,
      });
      if (error) {
        alert('Erreur lors de la création: ' + error.message);
      } else {
        setShowModal(false);
        await loadNotes(org.id, user.id);
      }
    }
  }

  async function handleDelete(noteId: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) return;

    const { error } = await deleteTrainerNote(noteId);
    if (error) {
      alert('Erreur lors de la suppression: ' + error.message);
    } else {
      if (org && user) {
        await loadNotes(org.id, user.id);
      }
    }
  }

  function clearFilters() {
    setFilters({
      course_id: '',
      module_id: '',
      session_id: '',
      user_id: '',
    });
    navigate('/trainer/notes');
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TrainerHeader />
      <div className="p-6 pt-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Mes notes</h1>
          <div className="flex gap-2">
            <button
              onClick={clearFilters}
              className="rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
            >
              Effacer filtres
            </button>
            <button
              onClick={handleCreate}
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Nouvelle note
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-lg border bg-white p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Formation</label>
              <select
                value={filters.course_id}
                onChange={(e) => setFilters({ ...filters, course_id: e.target.value, module_id: '' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                <option value="">Toutes les formations</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Module</label>
              <select
                value={filters.module_id}
                onChange={(e) => setFilters({ ...filters, module_id: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                disabled={!filters.course_id}
              >
                <option value="">Tous les modules</option>
                {modules
                  .filter(m => !filters.course_id || m.course_id === filters.course_id)
                  .map(module => (
                    <option key={module.id} value={module.id}>{module.title}</option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Session</label>
              <select
                value={filters.session_id}
                onChange={(e) => setFilters({ ...filters, session_id: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                <option value="">Toutes les sessions</option>
                {sessions
                  .filter(s => !filters.course_id || s.course_id === filters.course_id)
                  .map(session => (
                    <option key={session.id} value={session.id}>{session.title}</option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Apprenant</label>
              <select
                value={filters.user_id}
                onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                <option value="">Tous les apprenants</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.display_name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Notes list */}
        {notes.length === 0 ? (
          <div className="rounded-lg border bg-white p-8 text-center">
            <p className="text-gray-500">Aucune note trouvée</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => {
              // Résoudre les titres/noms depuis les lookups
              const courseName = note.course_id ? courses.find(c => c.id === note.course_id)?.title : null;
              const moduleName = note.module_id ? modules.find(m => m.id === note.module_id)?.title : null;
              const sessionName = note.session_id ? sessions.find(s => s.id === note.session_id)?.title : null;
              const userName = note.user_id ? users.find(u => u.id === note.user_id)?.display_name : null;
              
              const hasAssociations = courseName || moduleName || sessionName || userName;
              
              return (
                <div key={note.id} className="rounded-lg border bg-white p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {note.title || 'Sans titre'}
                      </h3>
                      
                      {/* Associations */}
                      {hasAssociations && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {courseName && (
                            <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                              📚 {courseName}
                            </span>
                          )}
                          {moduleName && (
                            <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                              📖 {moduleName}
                            </span>
                          )}
                          {sessionName && (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                              🗓️ {sessionName}
                            </span>
                          )}
                          {userName && (
                            <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">
                              👤 {userName}
                            </span>
                          )}
                        </div>
                      )}
                      
                      <p className="mt-3 text-gray-700 whitespace-pre-wrap">{note.content}</p>
                      
                      <div className="mt-4 flex flex-wrap gap-2">
                        {note.tags && note.tags.length > 0 && (
                          <>
                            {note.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-800"
                              >
                                {tag}
                              </span>
                            ))}
                          </>
                        )}
                      </div>
                      <p className="mt-4 text-xs text-gray-500">
                        {formatRelativeDate(note.updated_at)}
                      </p>
                    </div>
                    <div className="ml-4 flex gap-2">
                      <button
                        onClick={() => handleEdit(note)}
                        className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-2xl rounded-lg bg-white p-6">
              <h2 className="mb-4 text-xl font-bold">
                {editingNote ? 'Modifier la note' : 'Nouvelle note'}
              </h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSave(new FormData(e.currentTarget));
                }}
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Titre</label>
                    <input
                      type="text"
                      name="title"
                      defaultValue={editingNote?.title || ''}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contenu</label>
                    <textarea
                      name="content"
                      rows={6}
                      defaultValue={editingNote?.content || ''}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tags (séparés par des virgules)</label>
                    <input
                      type="text"
                      name="tags"
                      defaultValue={editingNote?.tags?.join(', ') || ''}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Formation</label>
                      <select
                        name="course_id"
                        defaultValue={editingNote?.course_id || filters.course_id || ''}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      >
                        <option value="">Aucune</option>
                        {courses.map(course => (
                          <option key={course.id} value={course.id}>{course.title}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Module</label>
                      <select
                        name="module_id"
                        defaultValue={editingNote?.module_id || filters.module_id || ''}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      >
                        <option value="">Aucun</option>
                        {modules.map(module => (
                          <option key={module.id} value={module.id}>{module.title}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Session</label>
                      <select
                        name="session_id"
                        defaultValue={editingNote?.session_id || filters.session_id || ''}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      >
                        <option value="">Aucune</option>
                        {sessions.map(session => (
                          <option key={session.id} value={session.id}>{session.title}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Apprenant</label>
                      <select
                        name="user_id"
                        defaultValue={editingNote?.user_id || filters.user_id || ''}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      >
                        <option value="">Aucun</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.display_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="is_private"
                        defaultChecked={editingNote?.is_private !== false}
                        className="rounded border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Note privée</span>
                    </label>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  >
                    {editingNote ? 'Mettre à jour' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

