import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Sparkles, TrendingUp, Clock, BookOpen, Layers, User } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'

interface Suggestion {
  id: string
  type: 'recent' | 'popular' | 'recommended'
  title: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  reason?: string
}

export function NavigationSuggestions() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!user?.id) return

    const loadSuggestions = async () => {
      try {
        // Récupérer les cours récemment consultés
        const { data: recentProgress } = await supabase
          .from('module_progress')
          .select('module_id, updated_at, modules(course_id, courses(id, title))')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(3)

        // Récupérer les cours populaires (basés sur le nombre d'enrollments)
        const { data: popularCourses } = await supabase
          .from('enrollments')
          .select('course_id, courses(id, title)')
          .limit(5)

        const recentSuggestions: Suggestion[] = []
        const courseIds = new Set<string>()

        // Suggestions récentes
        if (recentProgress) {
          recentProgress.forEach((progress: any) => {
            const course = progress.modules?.courses
            if (course && !courseIds.has(course.id)) {
              courseIds.add(course.id)
              recentSuggestions.push({
                id: `recent-${course.id}`,
                type: 'recent',
                title: course.title,
                path: `/courses/${course.id}`,
                icon: Clock,
                reason: 'Consulté récemment',
              })
            }
          })
        }

        // Suggestions populaires
        const popularSuggestions: Suggestion[] = []
        if (popularCourses) {
          const courseCounts = new Map<string, number>()
          popularCourses.forEach((enrollment: any) => {
            if (enrollment.courses) {
              const count = courseCounts.get(enrollment.course_id) || 0
              courseCounts.set(enrollment.course_id, count + 1)
            }
          })

          const sortedPopular = Array.from(courseCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)

          for (const [courseId, count] of sortedPopular) {
            if (!courseIds.has(courseId)) {
              const enrollment = popularCourses.find((e: any) => e.course_id === courseId)
              if (enrollment?.courses) {
                popularSuggestions.push({
                  id: `popular-${courseId}`,
                  type: 'popular',
                  title: enrollment.courses.title,
                  path: `/courses/${courseId}`,
                  icon: TrendingUp,
                  reason: `${count} apprenant${count > 1 ? 's' : ''}`,
                })
              }
            }
          }
        }

        // Suggestions recommandées (basées sur les formations non commencées)
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('course_id, courses(id, title)')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .limit(5)

        const recommendedSuggestions: Suggestion[] = []
        if (enrollments) {
          for (const enrollment of enrollments) {
            if (enrollment.courses && !courseIds.has(enrollment.courses.id)) {
              const { data: progress } = await supabase
                .from('module_progress')
                .select('id')
                .eq('user_id', user.id)
                .limit(1)

              if (!progress || progress.length === 0) {
                recommendedSuggestions.push({
                  id: `recommended-${enrollment.courses.id}`,
                  type: 'recommended',
                  title: enrollment.courses.title,
                  path: `/courses/${enrollment.courses.id}`,
                  icon: Sparkles,
                  reason: 'À commencer',
                })
                break // Une seule suggestion recommandée
              }
            }
          }
        }

        setSuggestions([
          ...recentSuggestions.slice(0, 2),
          ...popularSuggestions.slice(0, 2),
          ...recommendedSuggestions.slice(0, 1),
        ].slice(0, 5))
      } catch (error) {
        console.error('Error loading suggestions:', error)
      }
    }

    loadSuggestions()
  }, [user?.id, location.pathname])

  if (suggestions.length === 0) {
    return null
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        title="Suggestions de navigation"
      >
        <Sparkles className="w-4 h-4" />
        <span className="hidden md:inline">Suggestions</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-gray-200 shadow-xl z-50 max-h-96 overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <h3 className="font-semibold text-gray-900">Suggestions</h3>
              </div>
            </div>
            <div className="overflow-y-auto py-2">
              {suggestions.map((suggestion) => {
                const Icon = suggestion.icon
                return (
                  <button
                    key={suggestion.id}
                    onClick={() => {
                      navigate(suggestion.path)
                      setIsOpen(false)
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-start gap-3 group"
                  >
                    <div className={`p-2 rounded-lg ${
                      suggestion.type === 'recent' ? 'bg-blue-50' :
                      suggestion.type === 'popular' ? 'bg-green-50' :
                      'bg-purple-50'
                    }`}>
                      <Icon className={`w-4 h-4 ${
                        suggestion.type === 'recent' ? 'text-blue-600' :
                        suggestion.type === 'popular' ? 'text-green-600' :
                        'text-purple-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {suggestion.title}
                      </div>
                      {suggestion.reason && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {suggestion.reason}
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
