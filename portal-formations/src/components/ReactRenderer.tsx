import { CourseJson } from '../types/courseJson'
import { ItemRenderer } from './ItemRenderer'
import { RichTextEditor } from './RichTextEditor'
import { GameRenderer } from './GameRenderer'
import { GameErrorBoundary } from './GameErrorBoundary'
import { PdfViewer } from './PdfViewer'
import { CardMatchingGame } from './CardMatchingGame'
import { ColumnMatchingGame } from './ColumnMatchingGame'
import { ApiTypesGame } from './ApiTypesGame'
import { FormatFilesGame } from './FormatFilesGame'
import { ConnectionGame } from './ConnectionGame'
import { TimelineGame } from './TimelineGame'
import { CategoryGame } from './CategoryGame'
import { QuizGame } from './QuizGame'
import { IntroductionQuiz } from './IntroductionQuiz'
import { SlideBlock } from './SlideBlock'
import { ContextBlock } from './ContextBlock'
import { supabase } from '../lib/supabaseClient'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronUp, ChevronRight, Gamepad2, FileText, Presentation, PenTool, Code, ArrowRight } from 'lucide-react'

interface ReactRendererProps {
  courseJson: CourseJson
}

export function ReactRenderer({ courseJson }: ReactRendererProps) {
  // État pour gérer l'expansion des modules (repliés par défaut)
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set())

  const toggleModule = (moduleIndex: number) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(moduleIndex)) {
      newExpanded.delete(moduleIndex)
    } else {
      newExpanded.add(moduleIndex)
    }
    setExpandedModules(newExpanded)
  }

  // Récupérer le thème du cours ou utiliser les valeurs par défaut
  const courseTheme = courseJson.theme || {
    primaryColor: '#3B82F6',
    secondaryColor: '#8B5CF6',
    fontFamily: 'Inter'
  }

  // Styles CSS variables pour le thème
  const themeStyles = {
    '--theme-primary': courseTheme.primaryColor,
    '--theme-secondary': courseTheme.secondaryColor,
    '--theme-font': courseTheme.fontFamily
  } as React.CSSProperties

  // Trouver le lexique (premier item avec "lexique" dans le titre)
  const lexiqueItem = courseJson.modules
    ?.flatMap(m => m.items || [])
    .find(item => item.title.toLowerCase().includes('lexique') || item.content?.isLexique)

  return (
    <div 
      className="course-renderer"
      style={themeStyles}
    >
      {/* En-tête du cours */}
      <div className="mb-8 pb-6 border-b border-gray-200">
        <h1 
          className="text-2xl font-semibold mb-3"
          style={{ color: courseTheme.primaryColor }}
        >
          {courseJson.title}
        </h1>
        {courseJson.description && (
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-gray-700">
              {courseJson.description.split('\n').map((line, i) => {
                const trimmed = line.trim()
                if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
                  return (
                    <h3 key={i} className="font-semibold text-gray-900 my-4 text-xl">
                      {trimmed.replace(/\*\*/g, '')}
                    </h3>
                  )
                }
                if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                  return (
                    <p key={i} className="ml-6 my-2 text-gray-700">
                      • {trimmed.replace(/^[-*]\s+/, '')}
                    </p>
                  )
                }
                if (trimmed === '') {
                  return <br key={i} />
                }
                return <p key={i} className="my-2 text-gray-700">{line}</p>
              })}
            </div>
          </div>
        )}
      </div>



      {/* Modules */}
      <div className="space-y-6">
        {(courseJson.modules || []).map((module, moduleIndex) => {
          // Récupérer le thème du module ou utiliser celui du cours
          const moduleTheme = module.theme || courseTheme
          
          // Filtrer les items (exclure le lexique s'il est affiché séparément)
          const moduleItems = lexiqueItem 
            ? (module.items || []).filter(item => 
                !(item.title.toLowerCase().includes('lexique') || item.content?.isLexique)
              )
            : (module.items || [])

          if (moduleItems.length === 0) {
            return null
          }

          const isExpanded = expandedModules.has(moduleIndex)
          
          // Vérifier si le module contient des jeux
          const hasGames = moduleItems.some(item => item.type === 'game')
          
          // Fonction pour obtenir la couleur selon le type d'élément (cohérent avec CourseFeaturesTiles)
          const getItemTypeColor = (type: string) => {
            switch (type) {
              case 'resource':
                return 'text-blue-600'
              case 'slide':
                return 'text-green-600'
              case 'exercise':
              case 'activity':
                return 'text-yellow-600'
              case 'tp':
                return 'text-purple-600'
              case 'game':
                return 'text-red-600'
              default:
                return 'text-gray-600'
            }
          }

          // Fonction pour obtenir l'icône selon le type d'élément
          const getItemIcon = (type: string) => {
            switch (type) {
              case 'resource':
                return <FileText className="w-5 h-5" />
              case 'slide':
                return <Presentation className="w-5 h-5" />
              case 'exercise':
              case 'activity':
                return <PenTool className="w-5 h-5" />
              case 'tp':
                return <Code className="w-5 h-5" />
              case 'game':
                return <Gamepad2 className="w-5 h-5" />
              default:
                return <FileText className="w-5 h-5" />
            }
          }

          return (
            <div 
              key={moduleIndex}
              id={`module-${moduleIndex}`}
              className="module-container mb-8"
              style={{
                '--module-primary': moduleTheme.primaryColor,
                '--module-secondary': moduleTheme.secondaryColor,
                '--module-font': moduleTheme.fontFamily
              } as React.CSSProperties}
            >
              {/* Titre du module avec bouton pour replier/déplier */}
              <button
                onClick={() => toggleModule(moduleIndex)}
                className="w-full text-left mb-3 pb-2 border-b flex items-center justify-between hover:opacity-80 transition-opacity"
                style={{ 
                  color: moduleTheme.primaryColor,
                  borderColor: moduleTheme.primaryColor 
                }}
              >
                <div className="flex items-center space-x-2">
                  <h2 
                    className="text-xl font-semibold"
                    style={{ 
                      color: moduleTheme.primaryColor
                    }}
                  >
                    {module.title}
                  </h2>
                  {hasGames && (
                    <Gamepad2 
                      className={`w-5 h-5 ${getItemTypeColor('game')}`}
                      title="Ce module contient des jeux"
                    />
                  )}
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <span className="text-xs font-normal text-gray-500">
                    ({moduleItems.length} élément{moduleItems.length > 1 ? 's' : ''})
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5" style={{ color: moduleTheme.primaryColor }} />
                  ) : (
                    <ChevronRight className="w-5 h-5" style={{ color: moduleTheme.primaryColor }} />
                  )}
                </div>
              </button>

              {/* Items du module (affichés seulement si le module est déplié) */}
              {isExpanded && (
              <div className="space-y-6 ml-4 mt-4">
                {moduleItems.map((item, itemIndex) => {
                  if (!item.published && item.published !== undefined) {
                    return null
                  }

                  // Créer un ID d'ancre basé sur le titre de l'item (identique à celui dans CourseSidebar)
                  const anchorId = `item-${moduleIndex}-${itemIndex}-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

                  // Compter les chapitres si disponibles
                  const chaptersCount = item.chapters?.length || 0

                  return (
                    <div 
                      key={itemIndex} 
                      id={anchorId}
                      className="item-container border-l-2 pl-6 py-4"
                      style={{ borderLeftColor: moduleTheme.primaryColor }}
                    >
                      {/* Titre de l'item avec lien optionnel */}
                      <div className="mb-4">
                        {item.id ? (
                          <Link
                            to={`/items/${item.id}`}
                            className="flex items-center space-x-2 group"
                            title="Voir le détail complet"
                          >
                            <span className={getItemTypeColor(item.type)}>
                              {getItemIcon(item.type)}
                            </span>
                            <h3 
                              className="text-lg font-semibold text-gray-900 group-hover:text-blue-900 transition-colors"
                            >
                              {item.title}
                            </h3>
                            <ArrowRight className="w-4 h-4 text-blue-600 opacity-60 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className={getItemTypeColor(item.type)}>
                              {getItemIcon(item.type)}
                            </span>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {item.title}
                            </h3>
                          </div>
                        )}
                        {chaptersCount > 0 && (
                          <p className="text-xs text-gray-500 mt-1 ml-7">
                            {chaptersCount} chapitre{chaptersCount > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>

                      {/* Contenu de l'item selon son type */}
                      <div className="item-content">
                        {item.type === 'slide' ? (
                          // Pour les slides, utiliser SlideBlock et ContextBlock
                          renderSlide(item, moduleTheme)
                        ) : (
                          // Pour les autres types, utiliser renderItemContent
                          renderItemContent(item, moduleTheme)
                        )}
                      </div>
                      
                      {/* Afficher les titres des chapitres si disponibles (pour navigation) */}
                      {item.chapters && item.chapters.length > 0 && (
                        <div className="mt-4 ml-7 space-y-1">
                          <p className="text-xs font-medium text-gray-500 mb-2">Chapitres :</p>
                          {item.chapters
                            .sort((a, b) => (a.position || 0) - (b.position || 0))
                            .map((chapter, chapterIndex) => {
                              const isGame = chapter.type === 'game' || (!!chapter.game_content && typeof chapter.game_content === 'object')
                              return (
                                <div 
                                  key={chapterIndex}
                                  className="flex items-center space-x-2 py-1 px-2 text-xs text-gray-600"
                                >
                                  {isGame ? (
                                    <Gamepad2 className="w-3 h-3 text-red-500" />
                                  ) : (
                                    <span className="text-gray-400">•</span>
                                  )}
                                  <span className="truncate">{chapter.title}</span>
                                </div>
                              )
                            })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ChapterList({ chapters, theme }: { chapters: Array<{ title: string; position: number; content?: any; type?: 'content' | 'game'; game_content?: any }>, theme: any }) {
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set())

  const toggleChapter = (index: number) => {
    const newExpanded = new Set(expandedChapters)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedChapters(newExpanded)
  }


  return (
    <div className="space-y-3">
      {chapters.map((chapter, index) => {
        const isGame = chapter.type === 'game'
        const chapterNumber = chapters.filter((c, i) => i < index && c.type !== 'game').length + 1

        return (
          <div
            key={index}
            className={`border rounded-lg shadow-sm ${
              isGame 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-200 bg-white'
            }`}
          >
            <button
              onClick={() => toggleChapter(index)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors rounded-lg"
            >
              <div className="flex items-center space-x-3">
                {isGame ? (
                  <>
                    <Gamepad2 className="w-5 h-5 text-red-600" />
                    <h5 className="text-base font-medium text-red-900">{chapter.title}</h5>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-medium text-gray-500">#{chapterNumber}</span>
                    <h5 className="text-base font-medium text-gray-900">{chapter.title}</h5>
                  </>
                )}
              </div>
              {expandedChapters.has(index) ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>

            {expandedChapters.has(index) && (
              <div className="px-6 pb-6 border-t border-gray-200">
                <div className="pt-6">
                  {isGame ? (
                    chapter.game_content ? (
                      <GameErrorBoundary>
                        <GameRenderer
                          gameContent={chapter.game_content}
                          onScore={(score, metadata) => {
                            console.log('Game score:', score, metadata)
                          }}
                        />
                      </GameErrorBoundary>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-800 font-medium mb-2">⚠️ Jeu non configuré</p>
                        <p className="text-yellow-700 text-sm">
                          Le champ game_content est vide ou invalide.
                        </p>
                      </div>
                    )
                  ) : chapter.content ? (
                    // Support pour content.body (TipTap), content.text (texte simple) ou content (objet RichText direct)
                    chapter.content.body ? (
                      <RichTextEditor
                        content={chapter.content.body}
                        onChange={() => {}}
                        editable={false}
                      />
                    ) : chapter.content.text ? (
                      <div className="prose max-w-none whitespace-pre-wrap text-gray-700">
                        {chapter.content.text}
                      </div>
                    ) : typeof chapter.content === 'string' ? (
                      <div className="prose max-w-none whitespace-pre-wrap text-gray-700">
                        {chapter.content}
                      </div>
                    ) : (
                      <RichTextEditor
                        content={chapter.content}
                        onChange={() => {}}
                        editable={false}
                      />
                    )
                  ) : (
                    <p className="text-gray-500 italic">Ce chapitre n'a pas encore de contenu.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function renderItemContent(item: CourseJson['modules'][0]['items'][0], theme: any) {
  switch (item.type) {
    case 'resource':
      return renderResource(item, theme)
    case 'slide':
      return renderSlide(item, theme)
    case 'exercise':
    case 'activity': // Les activités sont traitées comme des exercices
      return renderExercise(item, theme)
    case 'tp':
      return renderTp(item, theme)
    case 'game':
      return renderGame(item, theme)
    default:
      return <p className="text-gray-600">Type d'élément non supporté.</p>
  }
}

function renderResource(item: CourseJson['modules'][0]['items'][0], theme: any) {
  if (item.external_url) {
    return (
      <div className="space-y-4">
        {item.content.description && (
          <p className="text-gray-600">{item.content.description}</p>
        )}
        <a
          href={item.external_url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary inline-block"
          style={{ backgroundColor: theme.primaryColor }}
        >
          Accéder à la ressource
        </a>
      </div>
    )
  }

  if (item.asset_path) {
    const { data } = supabase.storage
      .from('course-assets')
      .getPublicUrl(item.asset_path)

    return (
      <div className="space-y-4">
        {item.content.description && (
          <p className="text-gray-600">{item.content.description}</p>
        )}
        {item.asset_path.endsWith('.pdf') ? (
          <PdfViewer url={data.publicUrl} />
        ) : (
          <a
            href={data.publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-block"
            style={{ backgroundColor: theme.primaryColor }}
          >
            Télécharger le fichier
          </a>
        )}
      </div>
    )
  }

  if (item.content.body) {
    return (
      <div className="prose max-w-none">
        <RichTextEditor
          content={item.content.body}
          onChange={() => {}}
          editable={false}
        />
      </div>
    )
  }

  return <p className="text-gray-600">Contenu non disponible.</p>
}

function renderSlide(item: CourseJson['modules'][0]['items'][0], theme: any) {
  // Utiliser les nouveaux composants SlideBlock et ContextBlock
  return (
    <div className="slide-container space-y-0">
      {/* Slide principale (support projeté) */}
      <SlideBlock item={item} theme={theme} />
      
      {/* Contexte pédagogique sous la slide */}
      {item.content?.pedagogical_context && (
        <ContextBlock 
          context={item.content.pedagogical_context} 
          theme={theme} 
        />
      )}
      
      {/* Chapitres si disponibles (affichés après le contexte) */}
      {item.chapters && item.chapters.length > 0 && (
        <div className="mt-6">
          <ChapterList chapters={item.chapters} theme={theme} />
        </div>
      )}
    </div>
  )
}

function renderExercise(item: CourseJson['modules'][0]['items'][0], theme: any) {
  // Debug: afficher le contenu de l'exercice
  console.log('🔍 renderExercise - Item:', item.title)
  console.log('🔍 renderExercise - Content:', item.content)
  console.log('🔍 renderExercise - Content keys:', item.content ? Object.keys(item.content) : 'no content')
  
  // Détecter si c'est une activité Q/R avec plusieurs questions
  const isQRActivity = item.content?.questions && Array.isArray(item.content.questions) && item.content.questions.length > 0
  
  if (isQRActivity) {
    return renderQRActivity(item, theme)
  }
  
  // Détecter si c'est un exercice d'analyse d'API (structure enrichie)
  const isApiAnalysisExercise = item.content?.objective || item.content?.input_api || item.content?.instructions

  if (isApiAnalysisExercise) {
    return renderApiAnalysisExercise(item, theme)
  }

  // Rendu classique pour les exercices simples
  const hasQuestion = item.content?.question
  const hasCorrection = item.content?.correction
  const hasBody = item.content?.body
  const hasDescription = item.content?.description
  
  console.log('🔍 renderExercise - hasQuestion:', hasQuestion)
  console.log('🔍 renderExercise - hasBody:', hasBody)
  console.log('🔍 renderExercise - hasDescription:', hasDescription)

  // Si aucun contenu n'est disponible, afficher un message avec debug
  if (!hasQuestion && !hasBody && !hasDescription) {
    return (
      <div className="space-y-4">
        <div 
          className="p-4 rounded-lg border-2 border-dashed"
          style={{ 
            backgroundColor: `${theme.primaryColor}10`,
            borderColor: theme.primaryColor
          }}
        >
          <p className="text-gray-600 italic mb-2">
            Cliquez sur le bouton ci-dessous pour accéder à l'exercice et voir l'énoncé complet.
          </p>
          {/* Debug: afficher le contenu brut pour diagnostic */}
          {process.env.NODE_ENV === 'development' && item.content && (
            <details className="mt-2 text-xs">
              <summary className="cursor-pointer text-gray-500">Debug: Voir le contenu brut</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-40 text-xs">
                {JSON.stringify(item.content, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {hasDescription && (
        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: `${theme.primaryColor}10` }}
        >
          <p className="text-gray-700">{item.content.description}</p>
        </div>
      )}

      {hasQuestion && (
        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: `${theme.primaryColor}15` }}
        >
          <h4 
            className="font-medium mb-2"
            style={{ color: theme.primaryColor }}
          >
            Énoncé
          </h4>
          {typeof item.content.question === 'object' ? (
            <RichTextEditor
              content={item.content.question}
              onChange={() => {}}
              editable={false}
            />
          ) : (
            <div className="prose max-w-none">
              <p style={{ color: theme.primaryColor }}>{item.content.question}</p>
            </div>
          )}
        </div>
      )}

      {hasBody && (
        <div className="prose max-w-none">
          {typeof item.content.body === 'object' ? (
            <RichTextEditor
              content={item.content.body}
              onChange={() => {}}
              editable={false}
            />
          ) : (
            <div className="whitespace-pre-wrap text-gray-700">{item.content.body}</div>
          )}
        </div>
      )}
      
      {/* Afficher tout autre contenu disponible pour debug */}
      {process.env.NODE_ENV === 'development' && item.content && (
        <details className="mt-4 text-xs">
          <summary className="cursor-pointer text-gray-500">Debug: Tout le contenu</summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-60 text-xs">
            {JSON.stringify(item.content, null, 2)}
          </pre>
        </details>
      )}

      {hasCorrection && (
        <details className="p-4 rounded-lg border" style={{ borderColor: theme.secondaryColor }}>
          <summary 
            className="font-medium cursor-pointer"
            style={{ color: theme.secondaryColor }}
          >
            Voir la correction
          </summary>
          <div className="mt-4">
            {typeof item.content.correction === 'object' ? (
              <RichTextEditor
                content={item.content.correction}
                onChange={() => {}}
                editable={false}
              />
            ) : (
              <p style={{ color: theme.secondaryColor }}>{item.content.correction}</p>
            )}
          </div>
        </details>
      )}
    </div>
  )
}

function renderQRActivity(item: CourseJson['modules'][0]['items'][0], theme: any) {
  const content = item.content as any
  const questions = content.questions || []
  const expectedOutputs = content.expected_outputs || []
  const scenario = content.scenario
  const instructions = content.instructions
  const keyMessage = content.key_message

  return (
    <div className="space-y-6">
      {/* Description */}
      {content.description && (
        <div 
          className="p-4 rounded-lg border-l-4"
          style={{ 
            backgroundColor: `${theme.primaryColor}10`,
            borderLeftColor: theme.primaryColor
          }}
        >
          <h3 
            className="font-semibold mb-2"
            style={{ color: theme.primaryColor }}
          >
            Objectif
          </h3>
          <p className="text-gray-700">{content.description}</p>
        </div>
      )}

      {/* Instructions */}
      {instructions && (
        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: `${theme.secondaryColor}10` }}
        >
          <h4 
            className="font-medium mb-2"
            style={{ color: theme.secondaryColor }}
          >
            Instructions
          </h4>
          <p className="text-gray-700">{instructions}</p>
        </div>
      )}

      {/* Scénario */}
      {scenario && (
        <div 
          className="p-4 rounded-lg border"
          style={{ 
            backgroundColor: '#F9FAFB',
            borderColor: '#E5E7EB'
          }}
        >
          <h4 className="font-medium mb-2 text-gray-800">Scénario</h4>
          <p className="text-gray-700 italic">{scenario}</p>
        </div>
      )}

      {/* Questions */}
      {questions.length > 0 && (
        <div className="space-y-4">
          <h3 
            className="text-xl font-semibold"
            style={{ color: theme.primaryColor }}
          >
            Questions
          </h3>
          {questions.map((question: any, index: number) => (
            <div 
              key={question.id || index}
              className="p-4 rounded-lg border-l-4"
              style={{ 
                backgroundColor: `${theme.primaryColor}05`,
                borderLeftColor: theme.primaryColor
              }}
            >
              <div className="flex items-start space-x-3">
                <span 
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm"
                  style={{ 
                    backgroundColor: theme.primaryColor,
                    color: 'white'
                  }}
                >
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="text-gray-800 font-medium">{question.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Réponses attendues */}
      {expectedOutputs.length > 0 && (
        <details className="p-4 rounded-lg border" style={{ borderColor: theme.secondaryColor }}>
          <summary 
            className="font-medium cursor-pointer"
            style={{ color: theme.secondaryColor }}
          >
            Réponses attendues ({expectedOutputs.length})
          </summary>
          <div className="mt-4 space-y-2">
            {expectedOutputs.map((output: string, index: number) => (
              <div 
                key={index}
                className="p-3 rounded bg-green-50 border-l-4 border-green-500"
              >
                <div className="flex items-start space-x-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <p className="text-gray-700">{output}</p>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Message clé */}
      {keyMessage && (
        <div 
          className="p-4 rounded-lg border-l-4"
          style={{ 
            backgroundColor: `${theme.secondaryColor}15`,
            borderLeftColor: theme.secondaryColor
          }}
        >
          <h4 
            className="font-semibold mb-2"
            style={{ color: theme.secondaryColor }}
          >
            Message clé
          </h4>
          <p className="text-gray-800 font-medium">{keyMessage}</p>
        </div>
      )}
    </div>
  )
}

function renderApiAnalysisExercise(item: CourseJson['modules'][0]['items'][0], theme: any) {
  const content = item.content as any

  return (
    <div className="space-y-6">
      {/* Objectif */}
      {content.objective && (
        <div 
          className="p-4 rounded-lg border-l-4"
          style={{ 
            backgroundColor: `${theme.primaryColor}10`,
            borderLeftColor: theme.primaryColor
          }}
        >
          <h4 
            className="font-semibold mb-2 text-lg"
            style={{ color: theme.primaryColor }}
          >
            🎯 Objectif
          </h4>
          <p className="text-gray-700">{content.objective}</p>
        </div>
      )}

      {/* Durée et prérequis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {content.duration_minutes && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <span className="text-sm font-medium text-gray-600">⏱️ Durée estimée : </span>
            <span className="text-gray-900 font-semibold">{content.duration_minutes} minutes</span>
          </div>
        )}
        {content.prerequisites && content.prerequisites.length > 0 && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <span className="text-sm font-medium text-gray-600 block mb-2">📚 Prérequis :</span>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              {content.prerequisites.map((prereq: string, idx: number) => (
                <li key={idx}>{prereq}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Contexte */}
      {content.context && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-semibold mb-3 text-blue-900">📋 Contexte</h4>
          {content.context.domain && (
            <p className="mb-2">
              <span className="font-medium text-blue-800">Domaine : </span>
              <span className="text-blue-700">{content.context.domain}</span>
            </p>
          )}
          {content.context.entities && content.context.entities.length > 0 && (
            <div className="mb-2">
              <span className="font-medium text-blue-800">Entités : </span>
              <span className="text-blue-700">{content.context.entities.join(', ')}</span>
            </div>
          )}
          {content.context.business_rules && content.context.business_rules.length > 0 && (
            <div>
              <span className="font-medium text-blue-800 block mb-2">Règles métier :</span>
              <ul className="list-disc list-inside text-blue-700 space-y-1">
                {content.context.business_rules.map((rule: string, idx: number) => (
                  <li key={idx}>{rule}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* API d'entrée */}
      {content.input_api && (
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h4 className="font-semibold mb-3 text-yellow-900">🔌 API à analyser</h4>
          {content.input_api.endpoints && content.input_api.endpoints.length > 0 && (
            <div className="mb-4">
              <h5 className="font-medium text-yellow-800 mb-2">Endpoints :</h5>
              <div className="bg-white p-3 rounded border border-yellow-300 font-mono text-sm">
                {content.input_api.endpoints.map((endpoint: string, idx: number) => (
                  <div key={idx} className="text-yellow-900 py-1">{endpoint}</div>
                ))}
              </div>
            </div>
          )}
          {content.input_api.response_examples && content.input_api.response_examples.length > 0 && (
            <div>
              <h5 className="font-medium text-yellow-800 mb-2">Exemples de réponses :</h5>
              <div className="space-y-3">
                {content.input_api.response_examples.map((example: any, idx: number) => (
                  <div key={idx} className="bg-white p-3 rounded border border-yellow-300">
                    <div className="font-mono text-xs text-yellow-800 mb-2">
                      {example.endpoint}
                      {example.status && ` (${example.status})`}
                    </div>
                    <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                      {JSON.stringify(example.body, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      {content.instructions && content.instructions.length > 0 && (
        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: `${theme.primaryColor}15` }}
        >
          <h4 
            className="font-semibold mb-3 text-lg"
            style={{ color: theme.primaryColor }}
          >
            📝 Instructions
          </h4>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            {content.instructions.map((instruction: string, idx: number) => (
              <li key={idx} className="pl-2">{instruction}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Format de sortie attendu */}
      {content.expected_output_format && (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h4 className="font-semibold mb-3 text-green-900">📤 Format de sortie attendu</h4>
          {content.expected_output_format.sections && content.expected_output_format.sections.length > 0 && (
            <div>
              <span className="font-medium text-green-800 block mb-2">Sections requises :</span>
              <ul className="list-disc list-inside text-green-700 space-y-1">
                {content.expected_output_format.sections.map((section: string, idx: number) => (
                  <li key={idx}>{section}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Critères d'évaluation */}
      {content.criteria && content.criteria.length > 0 && (
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h4 className="font-semibold mb-3 text-purple-900">✅ Critères d'évaluation</h4>
          <ul className="list-disc list-inside text-purple-700 space-y-2">
            {content.criteria.map((criterion: string, idx: number) => (
              <li key={idx}>{criterion}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Livrables */}
      {content.deliverables && content.deliverables.length > 0 && (
        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
          <h4 className="font-semibold mb-3 text-indigo-900">📦 Livrables</h4>
          <ul className="list-disc list-inside text-indigo-700 space-y-1">
            {content.deliverables.map((deliverable: string, idx: number) => (
              <li key={idx}>{deliverable}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Barème de notation */}
      {content.scoring_rubric && (
        <div className="bg-gray-100 p-4 rounded-lg border border-gray-300">
          <h4 className="font-semibold mb-3 text-gray-900">📊 Barème de notation</h4>
          <div className="mb-2">
            <span className="font-medium text-gray-700">Total : </span>
            <span className="text-gray-900 font-bold">{content.scoring_rubric.total_points} points</span>
          </div>
          {content.scoring_rubric.breakdown && content.scoring_rubric.breakdown.length > 0 && (
            <div className="mt-3 space-y-2">
              {content.scoring_rubric.breakdown.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center bg-white p-2 rounded">
                  <span className="text-gray-700">{item.item}</span>
                  <span className="font-semibold text-gray-900">{item.points} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bonus */}
      {content.bonus_mastery && content.bonus_mastery.length > 0 && (
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <h4 className="font-semibold mb-3 text-amber-900">⭐ Bonus (Maîtrise avancée)</h4>
          <ul className="list-disc list-inside text-amber-700 space-y-1">
            {content.bonus_mastery.map((bonus: string, idx: number) => (
              <li key={idx}>{bonus}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Correction (si disponible) */}
      {content.correction && (
        <details className="bg-gray-50 p-4 rounded-lg border border-gray-300">
          <summary className="font-semibold text-gray-900 cursor-pointer">
            🔍 Voir la correction
          </summary>
          <div className="mt-4">
            {typeof content.correction === 'object' ? (
              <RichTextEditor
                content={content.correction}
                onChange={() => {}}
                editable={false}
              />
            ) : (
              <div className="prose max-w-none text-gray-700">
                {content.correction}
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  )
}

function renderTp(item: CourseJson['modules'][0]['items'][0], theme: any) {
  const content = item.content as any
  // Accepter "instruction" (singulier) ou "instructions" (pluriel)
  const instructionText = content.instruction || content.instructions
  
  return (
    <div className="space-y-6">
      {instructionText && (
        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: `${theme.secondaryColor}15` }}
        >
          <h4 
            className="font-medium mb-2"
            style={{ color: theme.secondaryColor }}
          >
            Consignes du TP
          </h4>
          {typeof instructionText === 'object' ? (
            <RichTextEditor
              content={instructionText}
              onChange={() => {}}
              editable={false}
            />
          ) : (
            <p style={{ color: theme.secondaryColor }}>{instructionText}</p>
          )}
        </div>
      )}

      {content.checklist && content.checklist.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Checklist</h4>
          <ul className="list-disc list-inside space-y-2">
            {content.checklist.map((task: string, index: number) => (
              <li key={index} className="text-gray-700">{task}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Critères d'évaluation */}
      {content.criteria && content.criteria.length > 0 && (
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h4 className="font-semibold mb-3 text-purple-900">✅ Critères d'évaluation</h4>
          <ul className="list-disc list-inside text-purple-700 space-y-2">
            {content.criteria.map((criterion: string, idx: number) => (
              <li key={idx}>{criterion}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Livrables */}
      {content.deliverables && content.deliverables.length > 0 && (
        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
          <h4 className="font-semibold mb-3 text-indigo-900">📦 Livrables</h4>
          <ul className="list-disc list-inside text-indigo-700 space-y-1">
            {content.deliverables.map((deliverable: string, idx: number) => (
              <li key={idx}>{deliverable}</li>
            ))}
          </ul>
        </div>
      )}

      {content.body && (
        <div className="prose max-w-none">
          <RichTextEditor
            content={content.body}
            onChange={() => {}}
            editable={false}
          />
        </div>
      )}
    </div>
  )
}

function renderGame(item: CourseJson['modules'][0]['items'][0], theme: any) {
  const gameType = item.content.gameType || 'matching'

  if (gameType === 'matching') {
    const pairs = item.content.pairs || []
    return (
      <div className="space-y-4">
        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: `${theme.primaryColor}15` }}
        >
          <h4 
            className="font-medium mb-2"
            style={{ color: theme.primaryColor }}
          >
            Jeu d'association de cartes
          </h4>
          {item.content.description && (
            <p style={{ color: theme.primaryColor }}>{item.content.description}</p>
          )}
        </div>
        <CardMatchingGame
          pairs={pairs}
          onScore={() => {}}
          description={item.content.instructions}
        />
      </div>
    )
  }

  if (gameType === 'column-matching') {
    const leftColumn = item.content.leftColumn || []
    const rightColumn = item.content.rightColumn || []
    const correctMatches = item.content.correctMatches || []

    return (
      <div className="space-y-4">
        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: `${theme.secondaryColor}15` }}
        >
          <h4 
            className="font-medium mb-2"
            style={{ color: theme.secondaryColor }}
          >
            Jeu d'association de colonnes
          </h4>
          {item.content.description && (
            <p style={{ color: theme.secondaryColor }}>{item.content.description}</p>
          )}
        </div>
        <ColumnMatchingGame
          leftColumn={leftColumn}
          rightColumn={rightColumn}
          correctMatches={correctMatches}
          onScore={() => {}}
          description={item.content.instructions}
        />
      </div>
    )
  }

  if (gameType === 'api-types') {
    const apiTypes = item.content.apiTypes || []
    const scenarios = item.content.scenarios || []

    return (
      <div className="space-y-4">
        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: `${theme.primaryColor}15` }}
        >
          <h4 
            className="font-medium mb-2"
            style={{ color: theme.primaryColor }}
          >
            Jeu : Types d'API
          </h4>
          {item.content.description && (
            <p style={{ color: theme.primaryColor }}>{item.content.description}</p>
          )}
        </div>
        <ApiTypesGame
          apiTypes={apiTypes}
          scenarios={scenarios}
          onScore={() => {}}
          description={item.content.instructions}
        />
      </div>
    )
  }

  if (gameType === 'format-files') {
    const levels = item.content.levels || []

    return (
      <div className="space-y-4">
        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: `${theme.primaryColor}15` }}
        >
          <h4 
            className="font-medium mb-2"
            style={{ color: theme.primaryColor }}
          >
            Jeu : Formats de fichiers
          </h4>
          {item.content.description && (
            <p style={{ color: theme.primaryColor }}>{item.content.description}</p>
          )}
        </div>
        <FormatFilesGame
          levels={levels}
          onScore={() => {}}
          description={item.content.instructions}
        />
      </div>
    )
  }

  if (gameType === 'connection') {
    const leftColumn = item.content.leftColumn || []
    const rightColumn = item.content.rightColumn || []
    const correctMatches = item.content.correctMatches || []

    return (
      <div className="space-y-4">
        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: `${theme.secondaryColor}15` }}
        >
          <h4 
            className="font-medium mb-2"
            style={{ color: theme.secondaryColor }}
          >
            Jeu de connexion avec lignes animées
          </h4>
          {item.content.description && (
            <p style={{ color: theme.secondaryColor }}>{item.content.description}</p>
          )}
        </div>
        <ConnectionGame
          leftColumn={leftColumn}
          rightColumn={rightColumn}
          correctMatches={correctMatches}
          onScore={() => {}}
          description={item.content.instructions}
        />
      </div>
    )
  }

  if (gameType === 'timeline') {
    const events = item.content.events || []
    const correctOrder = item.content.correctOrder || []

    return (
      <div className="space-y-4">
        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: `${theme.primaryColor}15` }}
        >
          <h4 
            className="font-medium mb-2"
            style={{ color: theme.primaryColor }}
          >
            Jeu de timeline chronologique
          </h4>
          {item.content.description && (
            <p style={{ color: theme.primaryColor }}>{item.content.description}</p>
          )}
        </div>
        <TimelineGame
          events={events}
          correctOrder={correctOrder}
          onScore={() => {}}
          description={item.content.instructions}
        />
      </div>
    )
  }

  if (gameType === 'category') {
    const categories = item.content.categories || []
    const items = item.content.items || []
    const correctCategories = item.content.correctCategories || []

    return (
      <div className="space-y-4">
        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: `${theme.secondaryColor}15` }}
        >
          <h4 
            className="font-medium mb-2"
            style={{ color: theme.secondaryColor }}
          >
            Jeu de classification
          </h4>
          {item.content.description && (
            <p style={{ color: theme.secondaryColor }}>{item.content.description}</p>
          )}
        </div>
        <CategoryGame
          categories={categories}
          items={items}
          correctCategories={correctCategories}
          onScore={() => {}}
          description={item.content.instructions}
        />
      </div>
    )
  }

  if (gameType === 'quiz') {
    const levels = item.content.levels || []

    return (
      <div className="space-y-4">
        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: `${theme.primaryColor}15` }}
        >
          <h4 
            className="font-medium mb-2"
            style={{ color: theme.primaryColor }}
          >
            Quiz interactif
          </h4>
          {item.content.description && (
            <p style={{ color: theme.primaryColor }}>{item.content.description}</p>
          )}
        </div>
        <QuizGame
          levels={levels}
          onScore={() => {}}
          description={item.content.description}
          instructions={item.content.instructions}
          objectives={item.content.objectives}
          scoring={item.content.scoring}
          itemId={item.id}
          quizType={`quiz_${item.id || 'big_data'}`}
        />
      </div>
    )
  }

  if (gameType === 'introduction-quiz') {
    const questions = item.content.questions || []

    return (
      <div className="space-y-4">
        <IntroductionQuiz
          questions={questions}
          title={item.title}
          description={item.content.description || item.content.instructions}
          onSave={(answers) => {
            console.log('Réponses sauvegardées:', answers)
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div 
        className="p-4 rounded-lg"
        style={{ backgroundColor: `${theme.primaryColor}15` }}
      >
        <h4 
          className="font-medium mb-2"
          style={{ color: theme.primaryColor }}
        >
          Mini-jeu
        </h4>
        <p style={{ color: theme.primaryColor }}>{item.content.description}</p>
      </div>
    </div>
  )
}

