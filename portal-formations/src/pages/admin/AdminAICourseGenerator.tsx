import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { generateCourse, CourseGenerationRequest, CourseGenerationProgress } from '../../lib/courseGenerator'
import { parseCourseContent, convertToGeneratorFormat } from '../../lib/courseContentParser'
import { Sparkles, Loader2, CheckCircle2, AlertCircle, Download, Save, Eye, Code, Upload, FileText } from 'lucide-react'
import { CourseJson } from '../../types/courseJson'

export function AdminAICourseGenerator() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState<CourseGenerationRequest>({
    title: '',
    description: '',
    theme: '',
    targetAudience: '',
    duration: '',
    learningObjectives: [''],
    modules: [''],
    includeQuizzes: true,
    includeExercises: true,
    includeGames: false,
    difficulty: 'intermediate',
    verbosity: 'balanced',
    precision: 'precise'
  })

  const [generatedCourse, setGeneratedCourse] = useState<CourseJson | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState<CourseGenerationProgress | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [importMode, setImportMode] = useState<'manual' | 'import'>('manual')
  const [importText, setImportText] = useState('')
  const [isParsing, setIsParsing] = useState(false)

  const handleInputChange = (field: keyof CourseGenerationRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleArrayChange = (field: 'learningObjectives' | 'modules', index: number, value: string) => {
    setFormData(prev => {
      const newArray = [...(prev[field] || [])]
      newArray[index] = value
      return { ...prev, [field]: newArray }
    })
  }

  const addArrayItem = (field: 'learningObjectives' | 'modules') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), '']
    }))
  }

  const removeArrayItem = (field: 'learningObjectives' | 'modules', index: number) => {
    setFormData(prev => {
      const newArray = [...(prev[field] || [])]
      newArray.splice(index, 1)
      return { ...prev, [field]: newArray.length > 0 ? newArray : [''] }
    })
  }

  const handleGenerate = async () => {
    if (!formData.title || !formData.description) {
      setError('Le titre et la description sont requis')
      return
    }

    setIsGenerating(true)
    setError('')
    setGeneratedCourse(null)
    setProgress(null)

    try {
      const course = await generateCourse(formData, (progress) => {
        setProgress(progress)
      })
      setGeneratedCourse(course as CourseJson)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la génération du cours')
      console.error('Erreur de génération:', err)
    } finally {
      setIsGenerating(false)
      setProgress(null)
    }
  }

  const handleDownload = () => {
    if (!generatedCourse) return

    const jsonString = JSON.stringify(generatedCourse, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${formData.title.toLowerCase().replace(/\s+/g, '-')}-course.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportToEditor = () => {
    if (!generatedCourse) return
    
    // Créer un nouveau cours avec le JSON généré
    navigate('/admin/courses/new/json', { 
      state: { initialJson: generatedCourse } 
    })
  }

  const handleParseImport = () => {
    if (!importText.trim()) {
      setError('Veuillez coller le contenu de la formation à importer')
      return
    }

    setIsParsing(true)
    setError('')

    try {
      // Parser le contenu
      const parsed = parseCourseContent(importText)
      
      // Convertir au format du générateur
      const generatorData = convertToGeneratorFormat(parsed)

      // Remplir le formulaire
      setFormData(prev => ({
        ...prev,
        title: generatorData.title || prev.title,
        description: generatorData.description || prev.description,
        theme: generatorData.theme || prev.theme,
        targetAudience: generatorData.targetAudience || prev.targetAudience,
        duration: generatorData.duration || prev.duration,
        learningObjectives: generatorData.learningObjectives && generatorData.learningObjectives.length > 0
          ? generatorData.learningObjectives
          : prev.learningObjectives,
        modules: generatorData.modules && generatorData.modules.length > 0
          ? generatorData.modules
          : prev.modules,
        difficulty: generatorData.difficulty || prev.difficulty
      }))

      // Passer en mode manuel pour permettre les modifications
      setImportMode('manual')
      
      // Afficher un message de succès
      setError('')
    } catch (err: any) {
      setError(`Erreur lors du parsing : ${err.message}`)
      console.error('Erreur de parsing:', err)
    } finally {
      setIsParsing(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Vous devez être connecté pour accéder à cette page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">Générateur de Cours IA</h1>
          </div>
          <p className="text-gray-600">
            Créez un cours complet automatiquement à partir d'une description détaillée. 
            L'IA génère le JSON compatible avec votre LMS.
          </p>
        </div>

        {/* Onglets Import / Manuel */}
        <div className="mb-6 bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-4 border-b border-gray-200 pb-4 mb-4">
            <button
              onClick={() => setImportMode('import')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                importMode === 'import'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Upload className="w-4 h-4" />
              Importer depuis un texte
            </button>
            <button
              onClick={() => setImportMode('manual')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                importMode === 'manual'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              Saisie manuelle
            </button>
          </div>

          {importMode === 'import' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Collez le contenu de la formation (programme, référentiel, etc.)
                </label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                  placeholder="Collez ici le contenu structuré de la formation (titre, objectifs, modules, etc.)"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Le système extraira automatiquement : titre, objectifs, compétences, modules, durée, prérequis, etc.
                </p>
              </div>
              <button
                onClick={handleParseImport}
                disabled={isParsing || !importText.trim()}
                className="w-full bg-purple-600 text-white py-2 px-6 rounded-md font-medium hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Extraction en cours...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Extraire les informations
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulaire de génération */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-900">Paramètres du cours</h2>

            <div className="space-y-6">
              {/* Titre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre du cours <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: Introduction au Machine Learning"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description détaillée <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Décrivez en détail le contenu du cours, les concepts à couvrir, l'approche pédagogique..."
                />
              </div>

              {/* Thème */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thème / Domaine
                </label>
                <input
                  type="text"
                  value={formData.theme}
                  onChange={(e) => handleInputChange('theme', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: Intelligence Artificielle, Développement Web, Data Science..."
                />
              </div>

              {/* Public cible */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Public cible
                </label>
                <input
                  type="text"
                  value={formData.targetAudience}
                  onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: Débutants, Développeurs confirmés, Étudiants..."
                />
              </div>

              {/* Durée */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durée estimée
                </label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: 20 heures, 5 jours, 10 semaines..."
                />
              </div>

              {/* Niveau de difficulté */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Niveau de difficulté
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => handleInputChange('difficulty', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="beginner">Débutant</option>
                  <option value="intermediate">Intermédiaire</option>
                  <option value="advanced">Avancé</option>
                </select>
              </div>

              {/* Objectifs pédagogiques */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Objectifs pédagogiques
                </label>
                {formData.learningObjectives?.map((obj, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={obj}
                      onChange={(e) => handleArrayChange('learningObjectives', index, e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder={`Objectif ${index + 1}`}
                    />
                    {formData.learningObjectives && formData.learningObjectives.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('learningObjectives', index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('learningObjectives')}
                  className="text-sm text-purple-600 hover:text-purple-700 mt-2"
                >
                  + Ajouter un objectif
                </button>
              </div>

              {/* Modules suggérés */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modules suggérés (optionnel)
                </label>
                {formData.modules?.map((mod, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={mod}
                      onChange={(e) => handleArrayChange('modules', index, e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder={`Module ${index + 1}`}
                    />
                    {formData.modules && formData.modules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('modules', index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('modules')}
                  className="text-sm text-purple-600 hover:text-purple-700 mt-2"
                >
                  + Ajouter un module
                </button>
              </div>

              {/* Options de contenu */}
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Contenu à inclure
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.includeQuizzes}
                      onChange={(e) => handleInputChange('includeQuizzes', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Quiz interactifs</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.includeExercises}
                      onChange={(e) => handleInputChange('includeExercises', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Exercices pratiques</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.includeGames}
                      onChange={(e) => handleInputChange('includeGames', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Jeux pédagogiques</span>
                  </label>
                </div>
              </div>

              {/* Paramètres de génération */}
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Paramètres de génération
                </label>
                
                {/* Verbosité */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Niveau de verbosité
                  </label>
                  <select
                    value={formData.verbosity}
                    onChange={(e) => handleInputChange('verbosity', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  >
                    <option value="concise">Concis - Contenu essentiel uniquement</option>
                    <option value="balanced">Équilibré - Contenu complet et structuré</option>
                    <option value="detailed">Détaillé - Contenu approfondi avec exemples</option>
                    <option value="very-detailed">Très détaillé - Contenu exhaustif et complet</option>
                    <option value="exhaustive">Exhaustif - Guide pratique complet avec procédures pas à pas</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.verbosity === 'concise' && 'Génère un contenu court et direct, idéal pour une vue d\'ensemble rapide.'}
                    {formData.verbosity === 'balanced' && 'Génère un contenu équilibré entre concision et détails, adapté à la plupart des cas.'}
                    {formData.verbosity === 'detailed' && 'Génère un contenu approfondi avec explications et exemples concrets.'}
                    {formData.verbosity === 'very-detailed' && 'Génère un contenu très complet avec explications approfondies et cas d\'usage détaillés.'}
                    {formData.verbosity === 'exhaustive' && 'Génère un guide pratique exhaustif avec procédures pas à pas détaillées. Explique non seulement QUOI faire mais aussi COMMENT le faire, étape par étape, avec tous les détails pratiques nécessaires.'}
                  </p>
                </div>

                {/* Précision */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Niveau de précision
                  </label>
                  <select
                    value={formData.precision}
                    onChange={(e) => handleInputChange('precision', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  >
                    <option value="general">Général - Concepts larges et vue d'ensemble</option>
                    <option value="precise">Précis - Concepts détaillés et techniques</option>
                    <option value="very-precise">Très précis - Terminologie exacte et détails techniques rigoureux</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.precision === 'general' && 'Approche générale avec concepts larges, adaptée pour une introduction.'}
                    {formData.precision === 'precise' && 'Approche précise avec concepts détaillés et terminologie spécifique.'}
                    {formData.precision === 'very-precise' && 'Approche très précise avec terminologie exacte et détails techniques rigoureux, idéale pour des formations techniques.'}
                  </p>
                </div>
              </div>

              {/* Bouton de génération */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !formData.title || !formData.description}
                className="w-full bg-purple-600 text-white py-3 px-6 rounded-md font-medium hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Générer le cours
                  </>
                )}
              </button>

              {/* Progression */}
              {progress && (
                <div className="mt-4 p-4 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-900 mb-2">{progress.step}</p>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(progress.progress / progress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Erreur */}
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Erreur</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Résultat généré */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Cours généré</h2>
              {generatedCourse && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setPreviewMode(!previewMode)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
                    title={previewMode ? 'Voir le JSON' : 'Voir la structure'}
                  >
                    {previewMode ? <Code className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
                    title="Télécharger le JSON"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleImportToEditor}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Importer dans l'éditeur
                  </button>
                </div>
              )}
            </div>

            {generatedCourse ? (
              <div className="space-y-4">
                {previewMode ? (
                  <div className="bg-gray-50 rounded-md p-4 max-h-[600px] overflow-auto">
                    <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                      {JSON.stringify(generatedCourse, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-md flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-green-900">Cours généré avec succès !</p>
                        <p className="text-sm text-green-700 mt-1">
                          {generatedCourse.modules?.length || 0} module(s),{' '}
                          {generatedCourse.modules?.reduce((acc, m) => acc + (m.items?.length || 0), 0) || 0} item(s)
                        </p>
                      </div>
                    </div>

                    <div className="border rounded-md p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">{generatedCourse.title}</h3>
                      <p className="text-sm text-gray-600 mb-4">{generatedCourse.description}</p>
                      
                      <div className="space-y-3">
                        {generatedCourse.modules?.map((module, moduleIndex) => (
                          <div key={moduleIndex} className="border-l-2 border-purple-500 pl-4">
                            <h4 className="font-medium text-gray-900 mb-2">
                              Module {moduleIndex + 1}: {module.title}
                            </h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {module.items?.map((item, itemIndex) => (
                                <li key={itemIndex} className="flex items-center gap-2">
                                  <span className="text-purple-600">•</span>
                                  <span>{item.title}</span>
                                  <span className="text-xs text-gray-400">({item.type})</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Le cours généré apparaîtra ici</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

