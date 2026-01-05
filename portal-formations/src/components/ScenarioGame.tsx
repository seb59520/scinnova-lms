import { useState } from 'react'
import { ChevronLeft, ChevronRight, BookOpen, CheckCircle2 } from 'lucide-react'
import { RichTextEditor } from './RichTextEditor'

interface ScenarioGameProps {
  chapters?: Array<{
    title: string
    position: number
    content?: any
  }>
  onScore?: (score: number, metadata?: any) => void
  description?: string
  instructions?: string
}

export function ScenarioGame({ chapters = [], onScore, description, instructions }: ScenarioGameProps) {
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0)
  const [completedChapters, setCompletedChapters] = useState<Set<number>>(new Set())

  // Trier les chapitres par position
  const sortedChapters = [...chapters].sort((a, b) => a.position - b.position)

  if (sortedChapters.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">
          Aucun chapitre disponible pour ce scénario.
        </p>
      </div>
    )
  }

  const currentChapter = sortedChapters[currentChapterIndex]
  const isFirstChapter = currentChapterIndex === 0
  const isLastChapter = currentChapterIndex === sortedChapters.length - 1

  const goToNextChapter = () => {
    if (!isLastChapter) {
      setCompletedChapters(prev => new Set([...prev, currentChapterIndex]))
      setCurrentChapterIndex(prev => prev + 1)
    } else {
      // Dernier chapitre : marquer comme complété et calculer le score
      setCompletedChapters(prev => new Set([...prev, currentChapterIndex]))
      if (onScore) {
        onScore(100, {
          chaptersCompleted: sortedChapters.length,
          totalChapters: sortedChapters.length
        })
      }
    }
  }

  const goToPreviousChapter = () => {
    if (!isFirstChapter) {
      setCurrentChapterIndex(prev => prev - 1)
    }
  }

  const goToChapter = (index: number) => {
    setCurrentChapterIndex(index)
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec description */}
      {(description || instructions) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          {description && (
            <p className="text-blue-800 font-medium mb-2">{description}</p>
          )}
          {instructions && (
            <p className="text-blue-700 text-sm">{instructions}</p>
          )}
        </div>
      )}

      {/* Navigation des chapitres */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4">
        <button
          onClick={goToPreviousChapter}
          disabled={isFirstChapter}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            isFirstChapter
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Précédent</span>
        </button>

        <div className="flex items-center space-x-2">
          {sortedChapters.map((chapter, index) => (
            <button
              key={index}
              onClick={() => goToChapter(index)}
              className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                index === currentChapterIndex
                  ? 'bg-blue-600 text-white ring-2 ring-blue-300 ring-offset-2'
                  : completedChapters.has(index)
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
              title={chapter.title}
            >
              {completedChapters.has(index) && index !== currentChapterIndex ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={goToNextChapter}
          disabled={isLastChapter && completedChapters.has(currentChapterIndex)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            isLastChapter && completedChapters.has(currentChapterIndex)
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <span>{isLastChapter ? 'Terminer' : 'Suivant'}</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Contenu du chapitre actuel */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-4 pb-4 border-b">
          <BookOpen className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-xl font-bold text-gray-900">{currentChapter.title}</h3>
            <p className="text-sm text-gray-500">
              Chapitre {currentChapterIndex + 1} sur {sortedChapters.length}
            </p>
          </div>
        </div>

        <div className="prose max-w-none">
          {currentChapter.content ? (
            <RichTextEditor
              content={currentChapter.content}
              onChange={() => {}}
              editable={false}
            />
          ) : (
            <p className="text-gray-500 italic">Ce chapitre n'a pas encore de contenu.</p>
          )}
        </div>
      </div>

      {/* Indicateur de progression */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progression</span>
          <span className="text-sm text-gray-600">
            {completedChapters.size + (completedChapters.has(currentChapterIndex) ? 0 : 1)} / {sortedChapters.length} chapitres
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((completedChapters.size + (completedChapters.has(currentChapterIndex) ? 0 : 1)) / sortedChapters.length) * 100}%`
            }}
          />
        </div>
      </div>

      {/* Message de fin */}
      {isLastChapter && completedChapters.has(currentChapterIndex) && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-green-900 mb-2">Scénario terminé !</h3>
          <p className="text-green-700">
            Vous avez complété tous les chapitres de ce scénario.
          </p>
        </div>
      )}
    </div>
  )
}


