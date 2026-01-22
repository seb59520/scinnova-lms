import { useState } from 'react'
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react'
import { PedagogicalObjective } from '../../types/database'

interface ObjectivesEditorProps {
  objectives: PedagogicalObjective[]
  onChange: (objectives: PedagogicalObjective[]) => void
}

export function ObjectivesEditor({ objectives, onChange }: ObjectivesEditorProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const generateId = () => `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const addObjective = () => {
    const newObjective: PedagogicalObjective = {
      id: generateId(),
      text: '',
      order: objectives.length
    }
    onChange([...objectives, newObjective])
  }

  const updateObjective = (id: string, updates: Partial<PedagogicalObjective>) => {
    onChange(objectives.map(obj =>
      obj.id === id ? { ...obj, ...updates } : obj
    ))
  }

  const deleteObjective = (id: string) => {
    const filtered = objectives.filter(obj => obj.id !== id)
    // Recalculate order
    const reordered = filtered.map((obj, index) => ({ ...obj, order: index }))
    onChange(reordered)
  }

  const moveObjective = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= objectives.length) return

    const newObjectives = [...objectives]
    const [moved] = newObjectives.splice(index, 1)
    newObjectives.splice(newIndex, 0, moved)

    // Update order values
    const reordered = newObjectives.map((obj, idx) => ({ ...obj, order: idx }))
    onChange(reordered)
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newObjectives = [...objectives]
    const [dragged] = newObjectives.splice(draggedIndex, 1)
    newObjectives.splice(index, 0, dragged)

    // Update order values
    const reordered = newObjectives.map((obj, idx) => ({ ...obj, order: idx }))
    onChange(reordered)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">
          Objectifs pedagogiques ({objectives.length})
        </h3>
        <button
          type="button"
          onClick={addObjective}
          className="inline-flex items-center space-x-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter</span>
        </button>
      </div>

      {objectives.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-gray-500 text-sm">
            Aucun objectif pedagogique defini.
          </p>
          <button
            type="button"
            onClick={addObjective}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Ajouter le premier objectif
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {objectives.map((objective, index) => (
            <div
              key={objective.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-start gap-2 p-3 bg-gray-50 rounded-lg border transition-all ${
                draggedIndex === index ? 'border-blue-400 shadow-md' : 'border-gray-200'
              }`}
            >
              <div className="cursor-move text-gray-400 hover:text-gray-600 pt-2">
                <GripVertical className="w-4 h-4" />
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={objective.text}
                    onChange={(e) => updateObjective(objective.id, { text: e.target.value })}
                    className="flex-1 input-field text-sm"
                    placeholder="Decrire l'objectif pedagogique..."
                  />
                </div>

                <div className="flex items-center gap-2 pl-8">
                  <label className="text-xs text-gray-500">Categorie:</label>
                  <input
                    type="text"
                    value={objective.category || ''}
                    onChange={(e) => updateObjective(objective.id, { category: e.target.value || undefined })}
                    className="input-field text-xs py-1 px-2 w-32"
                    placeholder="ex: Savoir-faire"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => moveObjective(index, 'up')}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:text-gray-200 disabled:cursor-not-allowed"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveObjective(index, 'down')}
                  disabled={index === objectives.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:text-gray-200 disabled:cursor-not-allowed"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => deleteObjective(objective.id)}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                title="Supprimer cet objectif"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500">
        Glissez-deposez les objectifs pour les reorganiser ou utilisez les fleches.
      </p>
    </div>
  )
}
