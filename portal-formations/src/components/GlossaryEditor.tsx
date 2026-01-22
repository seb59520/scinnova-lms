import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, Upload, Download, X } from 'lucide-react'
import { Glossary, GlossaryTerm, GlossaryCategory } from '../types/database'

interface GlossaryEditorProps {
  glossary: Glossary | null
  onChange: (glossary: Glossary | null) => void
}

export function GlossaryEditor({ glossary, onChange }: GlossaryEditorProps) {
  const [localGlossary, setLocalGlossary] = useState<Glossary | null>(glossary)
  const [editingTerm, setEditingTerm] = useState<GlossaryTerm | null>(null)
  const [showTermForm, setShowTermForm] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  useEffect(() => {
    setLocalGlossary(glossary)
  }, [glossary])

  const handleGlossaryInit = () => {
    const newGlossary: Glossary = {
      metadata: {
        title: 'Glossaire',
        description: '',
        version: '1.0.0',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      categories: [],
      terms: []
    }
    setLocalGlossary(newGlossary)
    onChange(newGlossary)
  }

  const handleAddCategory = () => {
    if (!localGlossary) return
    
    const categoryId = `cat-${Date.now()}`
    const newCategory: GlossaryCategory = {
      id: categoryId,
      name: `Nouvelle catégorie`,
      description: ''
    }
    
    const updated = {
      ...localGlossary,
      categories: [...(localGlossary.categories || []), newCategory]
    }
    setLocalGlossary(updated)
    onChange(updated)
  }

  const handleDeleteCategory = (categoryId: string) => {
    if (!localGlossary) return
    if (!confirm('Supprimer cette catégorie ? Les termes associés ne seront pas supprimés.')) return

    const updated = {
      ...localGlossary,
      categories: (localGlossary.categories || []).filter(c => c.id !== categoryId),
      terms: localGlossary.terms.map(term => 
        term.category_id === categoryId ? { ...term, category_id: undefined } : term
      )
    }
    setLocalGlossary(updated)
    onChange(updated)
  }

  const handleAddTerm = () => {
    if (!localGlossary) {
      handleGlossaryInit()
      return
    }

    const newTerm: GlossaryTerm = {
      id: `term-${Date.now()}`,
      word: '',
      explanation: '',
      example: '',
      category_id: selectedCategory || undefined,
      tags: [],
      language: 'python',
      difficulty: 'beginner'
    }
    setEditingTerm(newTerm)
    setShowTermForm(true)
  }

  const handleSaveTerm = () => {
    if (!localGlossary || !editingTerm) return

    if (!editingTerm.word.trim() || !editingTerm.explanation.trim() || !editingTerm.example.trim()) {
      alert('Veuillez remplir tous les champs obligatoires (mot, explication, exemple)')
      return
    }

    const existingIndex = localGlossary.terms.findIndex(t => t.id === editingTerm.id)
    const updated = {
      ...localGlossary,
      terms: existingIndex >= 0
        ? localGlossary.terms.map((t, i) => i === existingIndex ? editingTerm : t)
        : [...localGlossary.terms, editingTerm],
      metadata: {
        ...localGlossary.metadata,
        updated_at: new Date().toISOString()
      }
    }
    
    setLocalGlossary(updated)
    onChange(updated)
    setEditingTerm(null)
    setShowTermForm(false)
  }

  const handleDeleteTerm = (termId: string) => {
    if (!localGlossary) return
    if (!confirm('Supprimer ce terme ?')) return

    const updated = {
      ...localGlossary,
      terms: localGlossary.terms.filter(t => t.id !== termId)
    }
    setLocalGlossary(updated)
    onChange(updated)
  }

  const handleEditTerm = (term: GlossaryTerm) => {
    setEditingTerm({ ...term })
    setSelectedCategory(term.category_id || '')
    setShowTermForm(true)
  }

  const handleImportGlossary = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string)
        // Valider la structure
        if (imported.metadata && imported.terms) {
          setLocalGlossary(imported)
          onChange(imported)
        } else {
          alert('Format de glossaire invalide')
        }
      } catch (error) {
        alert('Erreur lors de l\'import: ' + (error as Error).message)
      }
    }
    reader.readAsText(file)
  }

  const handleExportGlossary = () => {
    if (!localGlossary) return

    const dataStr = JSON.stringify(localGlossary, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `glossaire-${localGlossary.metadata.title.toLowerCase().replace(/\s+/g, '-')}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (!localGlossary) {
    return (
      <div className="border rounded-lg p-6 bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">Glossaire</h3>
        <p className="text-gray-600 mb-4">Aucun glossaire associé à ce programme.</p>
        <button
          onClick={handleGlossaryInit}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 inline mr-2" />
          Créer un glossaire
        </button>
        <label className="ml-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer inline-block">
          <Upload className="w-4 h-4 inline mr-2" />
          Importer un glossaire
          <input
            type="file"
            accept=".json"
            onChange={handleImportGlossary}
            className="hidden"
          />
        </label>
      </div>
    )
  }

  const categories = localGlossary.categories || []
  const termsByCategory = categories.reduce((acc, cat) => {
    acc[cat.id] = localGlossary.terms.filter(t => t.category_id === cat.id)
    return acc
  }, {} as Record<string, GlossaryTerm[]>)
  const uncategorizedTerms = localGlossary.terms.filter(t => !t.category_id)

  return (
    <div className="border rounded-lg p-6 bg-white">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Glossaire</h3>
        <div className="flex gap-2">
          <label className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer text-sm">
            <Upload className="w-4 h-4 inline mr-1" />
            Importer
            <input
              type="file"
              accept=".json"
              onChange={handleImportGlossary}
              className="hidden"
            />
          </label>
          <button
            onClick={handleExportGlossary}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            <Download className="w-4 h-4 inline mr-1" />
            Exporter
          </button>
        </div>
      </div>

      {/* Métadonnées */}
      <div className="mb-6 p-4 bg-gray-50 rounded">
        <label className="block text-sm font-medium mb-2">Titre du glossaire</label>
        <input
          type="text"
          value={localGlossary.metadata.title}
          onChange={(e) => {
            const updated = {
              ...localGlossary,
              metadata: { ...localGlossary.metadata, title: e.target.value }
            }
            setLocalGlossary(updated)
            onChange(updated)
          }}
          className="w-full px-3 py-2 border rounded"
        />
        <label className="block text-sm font-medium mb-2 mt-3">Description</label>
        <textarea
          value={localGlossary.metadata.description || ''}
          onChange={(e) => {
            const updated = {
              ...localGlossary,
              metadata: { ...localGlossary.metadata, description: e.target.value }
            }
            setLocalGlossary(updated)
            onChange(updated)
          }}
          className="w-full px-3 py-2 border rounded"
          rows={2}
        />
      </div>

      {/* Catégories */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-medium">Catégories</h4>
          <button
            onClick={handleAddCategory}
            className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
          >
            <Plus className="w-4 h-4 inline mr-1" />
            Ajouter
          </button>
        </div>
        <div className="space-y-2">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex-1">
                <input
                  type="text"
                  value={cat.name}
                  onChange={(e) => {
                    const updated = {
                      ...localGlossary!,
                      categories: categories.map(c => 
                        c.id === cat.id ? { ...c, name: e.target.value } : c
                      )
                    }
                    setLocalGlossary(updated)
                    onChange(updated)
                  }}
                  className="px-2 py-1 border rounded text-sm"
                />
              </div>
              <button
                onClick={() => handleDeleteCategory(cat.id)}
                className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Termes */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-medium">Termes ({localGlossary.terms.length})</h4>
          <button
            onClick={handleAddTerm}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            <Plus className="w-4 h-4 inline mr-1" />
            Ajouter un terme
          </button>
        </div>

        {/* Termes par catégorie */}
        {categories.map(cat => {
          const terms = termsByCategory[cat.id] || []
          if (terms.length === 0) return null
          
          return (
            <div key={cat.id} className="mb-4">
              <h5 className="font-medium text-sm text-gray-700 mb-2">{cat.name}</h5>
              <div className="space-y-2">
                {terms.map(term => (
                  <div key={term.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex-1">
                      <span className="font-medium">{term.word}</span>
                      {term.tags && term.tags.length > 0 && (
                        <span className="ml-2 text-xs text-gray-500">
                          ({term.tags.join(', ')})
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleEditTerm(term)}
                      className="ml-2 px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-sm"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDeleteTerm(term.id)}
                      className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {/* Termes non catégorisés */}
        {uncategorizedTerms.length > 0 && (
          <div className="mb-4">
            <h5 className="font-medium text-sm text-gray-700 mb-2">Autres termes</h5>
            <div className="space-y-2">
              {uncategorizedTerms.map(term => (
                <div key={term.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex-1">
                    <span className="font-medium">{term.word}</span>
                    {term.tags && term.tags.length > 0 && (
                      <span className="ml-2 text-xs text-gray-500">
                        ({term.tags.join(', ')})
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleEditTerm(term)}
                    className="ml-2 px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-sm"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDeleteTerm(term.id)}
                    className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Formulaire d'édition de terme */}
      {showTermForm && editingTerm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold">
                {editingTerm.id.startsWith('term-') ? 'Nouveau terme' : 'Modifier le terme'}
              </h4>
              <button
                onClick={() => {
                  setShowTermForm(false)
                  setEditingTerm(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Mot *</label>
                <input
                  type="text"
                  value={editingTerm.word}
                  onChange={(e) => setEditingTerm({ ...editingTerm, word: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Explication *</label>
                <textarea
                  value={editingTerm.explanation}
                  onChange={(e) => setEditingTerm({ ...editingTerm, explanation: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  rows={4}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Exemple *</label>
                <textarea
                  value={editingTerm.example}
                  onChange={(e) => setEditingTerm({ ...editingTerm, example: e.target.value })}
                  className="w-full px-3 py-2 border rounded font-mono text-sm"
                  rows={6}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Catégorie</label>
                <select
                  value={editingTerm.category_id || ''}
                  onChange={(e) => {
                    setEditingTerm({ ...editingTerm, category_id: e.target.value || undefined })
                    setSelectedCategory(e.target.value)
                  }}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">Aucune catégorie</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tags (séparés par des virgules)</label>
                <input
                  type="text"
                  value={editingTerm.tags?.join(', ') || ''}
                  onChange={(e) => {
                    const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t)
                    setEditingTerm({ ...editingTerm, tags })
                  }}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Langage</label>
                  <select
                    value={editingTerm.language || 'python'}
                    onChange={(e) => setEditingTerm({ ...editingTerm, language: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="sql">SQL</option>
                    <option value="text">Texte</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Difficulté</label>
                  <select
                    value={editingTerm.difficulty || 'beginner'}
                    onChange={(e) => setEditingTerm({ 
                      ...editingTerm, 
                      difficulty: e.target.value as 'beginner' | 'intermediate' | 'advanced'
                    })}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="beginner">Débutant</option>
                    <option value="intermediate">Intermédiaire</option>
                    <option value="advanced">Avancé</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => {
                    setShowTermForm(false)
                    setEditingTerm(null)
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveTerm}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 inline mr-2" />
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
