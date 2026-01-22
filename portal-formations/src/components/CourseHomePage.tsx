import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Target,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Map,
  FileText,
  Play,
  ChevronRight,
  Award,
  Lightbulb,
  Code,
  Wrench,
  FolderOpen,
  ClipboardCheck
} from 'lucide-react'
import { Course, Module, Item, ItemCategory } from '../types/database'

interface ModuleWithItems extends Module {
  items: Item[]
}

interface CourseHomePageProps {
  course: Course
  modules: ModuleWithItems[]
  onStartCourse?: () => void
}

// Category display configuration
const CATEGORY_CONFIG: Record<ItemCategory, { label: string; icon: React.ReactNode; color: string }> = {
  cours: { label: 'Cours', icon: <BookOpen className="w-4 h-4" />, color: 'bg-blue-100 text-blue-700' },
  exemple: { label: 'Exemples', icon: <Lightbulb className="w-4 h-4" />, color: 'bg-yellow-100 text-yellow-700' },
  exercice: { label: 'Exercices', icon: <Code className="w-4 h-4" />, color: 'bg-green-100 text-green-700' },
  tp: { label: 'TP', icon: <Wrench className="w-4 h-4" />, color: 'bg-purple-100 text-purple-700' },
  ressource: { label: 'Ressources', icon: <FolderOpen className="w-4 h-4" />, color: 'bg-gray-100 text-gray-700' },
  evaluation: { label: 'Evaluations', icon: <ClipboardCheck className="w-4 h-4" />, color: 'bg-red-100 text-red-700' }
}

// Map item type to category if category is not set
function getItemCategory(item: Item): ItemCategory | null {
  if (item.category) return item.category

  // Auto-detect from type
  switch (item.type) {
    case 'slide':
      return 'cours'
    case 'resource':
      return 'ressource'
    case 'exercise':
    case 'activity':
      return 'exercice'
    case 'tp':
      return 'tp'
    case 'game':
      return 'exercice'
    default:
      return null
  }
}

export function CourseHomePage({ course, modules, onStartCourse }: CourseHomePageProps) {
  // Group items by category for each module
  const modulesWithCategories = useMemo(() => {
    return modules.map(module => {
      const categorizedItems: Record<string, Item[]> = {}

      module.items
        .filter(item => item.published !== false)
        .forEach(item => {
          const category = getItemCategory(item) || 'ressource'
          if (!categorizedItems[category]) {
            categorizedItems[category] = []
          }
          categorizedItems[category].push(item)
        })

      return {
        ...module,
        categorizedItems
      }
    })
  }, [modules])

  // Count total items by category across all modules
  const totalsByCategory = useMemo(() => {
    const totals: Record<string, number> = {}
    modulesWithCategories.forEach(module => {
      Object.entries(module.categorizedItems).forEach(([category, items]) => {
        totals[category] = (totals[category] || 0) + items.length
      })
    })
    return totals
  }, [modulesWithCategories])

  const objectives = course.pedagogical_objectives || []
  const prerequisites = course.prerequisites || []
  const recommendedPath = course.recommended_path
  const synthesis = course.final_synthesis
  const evaluationsConfig = course.evaluations_config

  const hasContent = objectives.length > 0 || prerequisites.length > 0 || recommendedPath || modules.length > 0

  if (!hasContent) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Cette formation n'a pas encore de contenu.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Course Title & Description */}
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>
        {course.description && (
          <p className="text-lg text-gray-600 leading-relaxed">{course.description}</p>
        )}
      </div>

      {/* Quick Stats */}
      <div className="flex flex-wrap justify-center gap-3">
        {modules.length > 0 && (
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
            <BookOpen className="w-4 h-4" />
            {modules.length} module{modules.length > 1 ? 's' : ''}
          </span>
        )}
        {Object.entries(totalsByCategory).map(([category, count]) => {
          const config = CATEGORY_CONFIG[category as ItemCategory]
          if (!config || count === 0) return null
          return (
            <span
              key={category}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${config.color}`}
            >
              {config.icon}
              {count} {config.label.toLowerCase()}
            </span>
          )
        })}
      </div>

      {/* Pedagogical Objectives */}
      {objectives.length > 0 && (
        <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Objectifs pedagogiques</h2>
          </div>
          <ul className="space-y-3">
            {objectives
              .sort((a, b) => a.order - b.order)
              .map((objective, index) => (
              <li key={objective.id} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="text-gray-700">{objective.text}</p>
                  {objective.category && (
                    <span className="text-xs text-blue-600 mt-1">{objective.category}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Prerequisites */}
      {prerequisites.length > 0 && (
        <section className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Prerequis</h2>
          </div>
          <div className="space-y-2">
            {prerequisites
              .sort((a, b) => a.order - b.order)
              .map((prereq) => {
              const levelColors = {
                required: 'bg-red-100 text-red-700 border-red-200',
                recommended: 'bg-yellow-100 text-yellow-700 border-yellow-200',
                optional: 'bg-gray-100 text-gray-600 border-gray-200'
              }
              const levelLabels = {
                required: 'Requis',
                recommended: 'Recommande',
                optional: 'Optionnel'
              }
              const level = prereq.level || 'required'

              return (
                <div key={prereq.id} className="flex items-start gap-3">
                  <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded border ${levelColors[level]}`}>
                    {levelLabels[level]}
                  </span>
                  <p className="text-gray-700">{prereq.text}</p>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Recommended Path */}
      {recommendedPath && (
        <section className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Map className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Parcours conseille</h2>
          </div>
          <p className="text-gray-700 whitespace-pre-wrap">{recommendedPath}</p>
        </section>
      )}

      {/* Table des matieres complete - style livre */}
      {modulesWithCategories.length > 0 && (
        <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-slate-50 to-white border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Table des matieres</h2>
                <p className="text-sm text-gray-500">
                  {modulesWithCategories.length} module{modulesWithCategories.length > 1 ? 's' : ''} · {modulesWithCategories.reduce((acc, m) => acc + m.items.filter(i => i.published !== false).length, 0)} elements
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {modulesWithCategories.map((module, moduleIndex) => {
              const publishedItems = module.items.filter(i => i.published !== false)

              return (
                <div key={module.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                  {/* En-tete du module */}
                  <div className="flex items-start gap-4 mb-3">
                    <span className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-xl text-lg font-bold shadow-sm">
                      {moduleIndex + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-lg">{module.title}</h3>
                      {/* Badges categories */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {Object.entries(module.categorizedItems).map(([category, items]) => {
                          const config = CATEGORY_CONFIG[category as ItemCategory]
                          if (!config) return null
                          return (
                            <span
                              key={category}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${config.color}`}
                            >
                              {config.icon}
                              <span>{items.length} {config.label.toLowerCase()}</span>
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Liste des elements */}
                  {publishedItems.length > 0 && (
                    <div className="ml-14 space-y-1">
                      {publishedItems.map((item, itemIndex) => {
                        const category = getItemCategory(item)
                        const config = category ? CATEGORY_CONFIG[category] : null

                        return (
                          <Link
                            key={item.id}
                            to={`/items/${item.id}`}
                            className="group flex items-center gap-3 py-2 px-3 -mx-3 rounded-lg hover:bg-white hover:shadow-sm transition-all"
                          >
                            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-xs font-medium text-gray-400 bg-gray-100 rounded group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors">
                              {itemIndex + 1}
                            </span>
                            <span className="flex-1 text-gray-700 group-hover:text-gray-900 transition-colors">
                              {item.title}
                            </span>
                            {config && (
                              <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs opacity-60 group-hover:opacity-100 transition-opacity ${config.color}`}>
                                {config.icon}
                              </span>
                            )}
                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-purple-500 transition-colors" />
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Evaluations */}
      {evaluationsConfig && evaluationsConfig.items && evaluationsConfig.items.length > 0 && (
        <section className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-6 border border-red-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <Award className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Evaluations</h2>
            {evaluationsConfig.passingScore && (
              <span className="ml-auto text-sm text-gray-600">
                Score de reussite : <strong>{evaluationsConfig.passingScore}%</strong>
              </span>
            )}
          </div>
          <div className="space-y-2">
            {evaluationsConfig.items.map((evalItem, index) => (
              <div key={evalItem.itemId} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-red-100">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-red-100 text-red-700 rounded-full text-sm font-medium">
                  {index + 1}
                </span>
                <span className="flex-1 text-gray-700">{evalItem.title}</span>
                <span className="text-sm text-gray-500">Coef. {evalItem.weight}</span>
                {evalItem.threshold && (
                  <span className="text-sm text-red-600">Min. {evalItem.threshold}%</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Final Synthesis Preview */}
      {synthesis && (synthesis.summary || (synthesis.keyPoints && synthesis.keyPoints.length > 0)) && (
        <section className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Synthese finale</h2>
          </div>

          {synthesis.summary && (
            <p className="text-gray-700 mb-4">{synthesis.summary}</p>
          )}

          {synthesis.keyPoints && synthesis.keyPoints.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Points cles a retenir :</h3>
              <ul className="space-y-2">
                {synthesis.keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Start Course Button */}
      {modules.length > 0 && onStartCourse && (
        <div className="flex justify-center pt-4">
          <button
            onClick={onStartCourse}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all"
          >
            <Play className="w-5 h-5" />
            Commencer la formation
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  )
}
