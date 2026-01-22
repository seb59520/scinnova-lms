import { useState } from 'react'
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { FinalSynthesis } from '../../types/database'
import { RichTextEditor } from '../RichTextEditor'

interface SynthesisEditorProps {
  synthesis: FinalSynthesis | null
  onChange: (synthesis: FinalSynthesis | null) => void
}

export function SynthesisEditor({ synthesis, onChange }: SynthesisEditorProps) {
  const currentSynthesis = synthesis || { keyPoints: [] }

  const updateBody = (content: Record<string, any>) => {
    onChange({
      ...currentSynthesis,
      body: content
    })
  }

  const updateSummary = (summary: string) => {
    onChange({
      ...currentSynthesis,
      summary: summary || undefined
    })
  }

  const addKeyPoint = () => {
    const keyPoints = currentSynthesis.keyPoints || []
    onChange({
      ...currentSynthesis,
      keyPoints: [...keyPoints, '']
    })
  }

  const updateKeyPoint = (index: number, value: string) => {
    const keyPoints = [...(currentSynthesis.keyPoints || [])]
    keyPoints[index] = value
    onChange({
      ...currentSynthesis,
      keyPoints
    })
  }

  const removeKeyPoint = (index: number) => {
    const keyPoints = (currentSynthesis.keyPoints || []).filter((_, i) => i !== index)
    onChange({
      ...currentSynthesis,
      keyPoints
    })
  }

  const moveKeyPoint = (index: number, direction: 'up' | 'down') => {
    const keyPoints = [...(currentSynthesis.keyPoints || [])]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= keyPoints.length) return

    const [moved] = keyPoints.splice(index, 1)
    keyPoints.splice(newIndex, 0, moved)
    onChange({
      ...currentSynthesis,
      keyPoints
    })
  }

  const clearAll = () => {
    if (confirm('Etes-vous sur de vouloir effacer toute la synthese ?')) {
      onChange(null)
    }
  }

  const hasContent = currentSynthesis.body || currentSynthesis.summary || (currentSynthesis.keyPoints && currentSynthesis.keyPoints.length > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">
          Synthese finale
        </h3>
        {hasContent && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-red-600 hover:text-red-800"
          >
            Effacer tout
          </button>
        )}
      </div>

      {/* Summary (quick text) */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-600">
          Resume (optionnel)
        </label>
        <textarea
          value={currentSynthesis.summary || ''}
          onChange={(e) => updateSummary(e.target.value)}
          className="input-field text-sm"
          rows={3}
          placeholder="Un bref resume de la formation en quelques lignes..."
        />
        <p className="text-xs text-gray-400">
          Ce resume apparaitra en haut de la synthese finale.
        </p>
      </div>

      {/* Key Points */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-600">
            Points cles ({(currentSynthesis.keyPoints || []).length})
          </label>
          <button
            type="button"
            onClick={addKeyPoint}
            className="inline-flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Ajouter</span>
          </button>
        </div>

        {(currentSynthesis.keyPoints || []).length === 0 ? (
          <div className="text-center py-4 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-gray-400 text-xs">
              Ajoutez des points cles a retenir
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {(currentSynthesis.keyPoints || []).map((point, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200"
              >
                <span className="text-xs font-semibold text-gray-400 w-5">
                  {index + 1}.
                </span>
                <input
                  type="text"
                  value={point}
                  onChange={(e) => updateKeyPoint(index, e.target.value)}
                  className="flex-1 input-field text-sm py-1"
                  placeholder="Point cle a retenir..."
                />
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveKeyPoint(index, 'up')}
                    disabled={index === 0}
                    className="p-0.5 text-gray-400 hover:text-gray-600 disabled:text-gray-200"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveKeyPoint(index, 'down')}
                    disabled={index === (currentSynthesis.keyPoints || []).length - 1}
                    className="p-0.5 text-gray-400 hover:text-gray-600 disabled:text-gray-200"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeKeyPoint(index)}
                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rich text body */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-600">
          Contenu detaille (optionnel)
        </label>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <RichTextEditor
            content={currentSynthesis.body || null}
            onChange={updateBody}
            placeholder="Contenu detaille de la synthese finale..."
          />
        </div>
        <p className="text-xs text-gray-400">
          Ce contenu apparaitra a la fin de la formation, apres les modules.
        </p>
      </div>
    </div>
  )
}
