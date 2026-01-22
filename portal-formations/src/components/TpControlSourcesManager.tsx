import { useState } from 'react';
import { Plus, Trash2, FileText, Link as LinkIcon, X } from 'lucide-react';

interface Source {
  type: 'file' | 'link';
  name?: string;
  content?: string;
  url?: string;
  label?: string;
}

interface TpControlSourcesManagerProps {
  sources: Source[];
  onChange: (sources: Source[]) => void;
}

export function TpControlSourcesManager({ sources, onChange }: TpControlSourcesManagerProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSource, setNewSource] = useState<Source>({ type: 'file', name: '', content: '' });

  const handleAddSource = () => {
    if (newSource.type === 'file' && (!newSource.name || !newSource.content)) {
      return;
    }
    if (newSource.type === 'link' && (!newSource.url || !newSource.label)) {
      return;
    }

    onChange([...sources, { ...newSource }]);
    setNewSource({ type: 'file', name: '', content: '' });
    setShowAddModal(false);
  };

  const handleRemoveSource = (index: number) => {
    onChange(sources.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Sources à fournir aux apprenants
        </label>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
        >
          <Plus className="w-4 h-4" />
          Ajouter une source
        </button>
      </div>

      {/* Liste des sources */}
      {sources.length > 0 ? (
        <div className="space-y-2">
          {sources.map((source, index) => (
            <div key={index} className="bg-gray-50 border border-gray-300 rounded-lg p-3 flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {source.type === 'file' ? (
                    <FileText className="w-4 h-4 text-blue-600" />
                  ) : (
                    <LinkIcon className="w-4 h-4 text-green-600" />
                  )}
                  <span className="font-medium text-gray-900">
                    {source.type === 'file' ? source.name : source.label}
                  </span>
                  <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                    {source.type === 'file' ? 'Fichier' : 'Lien'}
                  </span>
                </div>
                {source.type === 'file' && source.content && (
                  <p className="text-xs text-gray-600 mt-1">
                    {source.content.length} caractères
                  </p>
                )}
                {source.type === 'link' && source.url && (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {source.url}
                  </a>
                )}
              </div>
              <button
                onClick={() => handleRemoveSource(index)}
                className="ml-3 p-1 text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic">Aucune source ajoutée</p>
      )}

      {/* Modal d'ajout */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Ajouter une source</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewSource({ type: 'file', name: '', content: '' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              {/* Type de source */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de source
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewSource({ ...newSource, type: 'file', name: '', content: '' })}
                    className={`px-4 py-2 rounded-lg ${
                      newSource.type === 'file'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <FileText className="w-4 h-4 inline mr-2" />
                    Fichier
                  </button>
                  <button
                    onClick={() => setNewSource({ ...newSource, type: 'link', url: '', label: '' })}
                    className={`px-4 py-2 rounded-lg ${
                      newSource.type === 'link'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <LinkIcon className="w-4 h-4 inline mr-2" />
                    Lien
                  </button>
                </div>
              </div>

              {/* Champs selon le type */}
              {newSource.type === 'file' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom du fichier *
                    </label>
                    <input
                      type="text"
                      value={newSource.name || ''}
                      onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="exemple.py"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contenu du fichier *
                    </label>
                    <textarea
                      value={newSource.content || ''}
                      onChange={(e) => setNewSource({ ...newSource, content: e.target.value })}
                      rows={10}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      placeholder="# Contenu du fichier..."
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Label du lien *
                    </label>
                    <input
                      type="text"
                      value={newSource.label || ''}
                      onChange={(e) => setNewSource({ ...newSource, label: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Documentation Python"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL *
                    </label>
                    <input
                      type="url"
                      value={newSource.url || ''}
                      onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="https://docs.python.org/..."
                    />
                  </div>
                </>
              )}
            </div>

            {/* Boutons */}
            <div className="flex justify-end gap-2 pt-4 border-t mt-4">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewSource({ type: 'file', name: '', content: '' });
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleAddSource}
                disabled={
                  (newSource.type === 'file' && (!newSource.name || !newSource.content)) ||
                  (newSource.type === 'link' && (!newSource.url || !newSource.label))
                }
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
