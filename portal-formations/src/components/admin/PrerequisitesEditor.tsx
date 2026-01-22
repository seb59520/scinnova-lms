import { useState } from 'react'
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react'
import { Prerequisite } from '../../types/database'

interface PrerequisitesEditorProps {
  prerequisites: Prerequisite[]
  onChange: (prerequisites: Prerequisite[]) => void
}

const LEVEL_LABELS: Record<string, { label: string; color: string }> = {
  required: { label: 'Requis', color: 'bg-red-100 text-red-700' },
  recommended: { label: 'Recommande', color: 'bg-yellow-100 text-yellow-700' },
  optional: { label: 'Optionnel', color: 'bg-gray-100 text-gray-700' }
}

export function PrerequisitesEditor({ prerequisites, onChange }: PrerequisitesEditorProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const generateId = () => `prereq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const addPrerequisite = (level: 'required' | 'recommended' | 'optional' = 'required') => {
    const newPrereq: Prerequisite = {
      id: generateId(),
      text: '',
      level,
      order: prerequisites.length
    }
    onChange([...prerequisites, newPrereq])
  }

  const updatePrerequisite = (id: string, updates: Partial<Prerequisite>) => {
    onChange(prerequisites.map(prereq =>
      prereq.id === id ? { ...prereq, ...updates } : prereq
    ))
  }

  const deletePrerequisite = (id: string) => {
    const filtered = prerequisites.filter(prereq => prereq.id !== id)
    const reordered = filtered.map((prereq, index) => ({ ...prereq, order: index }))
    onChange(reordered)
  }

  const movePrerequisite = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= prerequisites.length) return

    const newPrereqs = [...prerequisites]
    const [moved] = newPrereqs.splice(index, 1)
    newPrereqs.splice(newIndex, 0, moved)

    const reordered = newPrereqs.map((prereq, idx) => ({ ...prereq, order: idx }))
    onChange(reordered)
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newPrereqs = [...prerequisites]
    const [dragged] = newPrereqs.splice(draggedIndex, 1)
    newPrereqs.splice(index, 0, dragged)

    const reordered = newPrereqs.map((prereq, idx) => ({ ...prereq, order: idx }))
    onChange(reordered)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  // Group by level for display
  const groupedByLevel = {
    required: prerequisites.filter(p => p.level === 'required'),
    recommended: prerequisites.filter(p => p.level === 'recommended'),
    optional: prerequisites.filter(p => p.level === 'optional')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">
          Prerequis ({prerequisites.length})
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => addPrerequisite('required')}
            className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Requis</span>
          </button>
          <button
            type="button"
            onClick={() => addPrerequisite('recommended')}
            className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Recommande</span>
          </button>
          <button
            type="button"
            onClick={() => addPrerequisite('optional')}
            className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Optionnel</span>
          </button>
        </div>
      </div>

      {prerequisites.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-gray-500 text-sm">
            Aucun prerequis defini.
          </p>
          <button
            type="button"
            onClick={() => addPrerequisite('required')}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Ajouter le premier prerequis
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {prerequisites
            .sort((a, b) => a.order - b.order)
            .map((prereq, index) => (
            <div
              key={prereq.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-2 p-3 bg-gray-50 rounded-lg border transition-all ${
                draggedIndex === index ? 'border-blue-400 shadow-md' : 'border-gray-200'
              }`}
            >
              <div className="cursor-move text-gray-400 hover:text-gray-600">
                <GripVertical className="w-4 h-4" />
              </div>

              <select
                value={prereq.level || 'required'}
                onChange={(e) => updatePrerequisite(prereq.id, {
                  level: e.target.value as 'required' | 'recommended' | 'optional'
                })}
                className={`text-xs font-medium px-2 py-1 rounded-full border-0 ${
                  LEVEL_LABELS[prereq.level || 'required']?.color || 'bg-gray-100 text-gray-700'
                }`}
              >
                <option value="required">Requis</option>
                <option value="recommended">Recommande</option>
                <option value="optional">Optionnel</option>
              </select>

              <input
                type="text"
                value={prereq.text}
                onChange={(e) => updatePrerequisite(prereq.id, { text: e.target.value })}
                className="flex-1 input-field text-sm"
                placeholder="Decrire le prerequis..."
              />

              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => movePrerequisite(index, 'up')}
                  disabled={index === 0}
                  className="p-0.5 text-gray-400 hover:text-gray-600 disabled:text-gray-200 disabled:cursor-not-allowed"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => movePrerequisite(index, 'down')}
                  disabled={index === prerequisites.length - 1}
                  className="p-0.5 text-gray-400 hover:text-gray-600 disabled:text-gray-200 disabled:cursor-not-allowed"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => deletePrerequisite(prereq.id)}
                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                title="Supprimer ce prerequis"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Summary by level */}
      {prerequisites.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            {groupedByLevel.required.length} requis
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
            {groupedByLevel.recommended.length} recommande(s)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-400"></span>
            {groupedByLevel.optional.length} optionnel(s)
          </span>
        </div>
      )}
    </div>
  )
}
