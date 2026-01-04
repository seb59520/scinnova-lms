import { ComponentType } from 'react'
import { CardMatchingGame } from '../components/CardMatchingGame'
import { ColumnMatchingGame } from '../components/ColumnMatchingGame'
import { ConnectionGame } from '../components/ConnectionGame'
import { TimelineGame } from '../components/TimelineGame'
import { CategoryGame } from '../components/CategoryGame'
import { ApiTypesGame } from '../components/ApiTypesGame'
import { FormatFilesGame } from '../components/FormatFilesGame'
import { JsonFileTypesGame } from '../components/JsonFileTypesGame'
import { ScenarioGame } from '../components/ScenarioGame'
import { QuizGame } from '../components/QuizGame'
import { ApiBuilderGame } from '../components/ApiBuilderGame'
import { GraphQLQueryBuilder } from '../components/GraphQLQueryBuilder'
import { ApiParadigmsGame } from '../components/ApiParadigmsGame'
import { WebSocketQuizGame } from '../components/WebSocketQuizGame'

/**
 * Interface pour les props communes à tous les jeux
 */
export interface BaseGameProps {
  onScore?: (score: number, metadata?: any) => void
  description?: string
  instructions?: string
}

/**
 * Type pour les données de configuration d'un jeu
 */
export type GameConfig = {
  gameType: string
  [key: string]: any
}

/**
 * Interface pour un jeu enregistré dans le registre
 */
export interface RegisteredGame {
  /** Type unique du jeu (ex: 'api-types', 'format-files') */
  gameType: string
  /** Nom affiché du jeu */
  name: string
  /** Description du jeu */
  description: string
  /** Composant React du jeu */
  component: ComponentType<any>
  /** Fonction de validation pour vérifier que la config est valide */
  validateConfig?: (config: GameConfig) => boolean
}

/**
 * Registre centralisé des jeux
 */
class GameRegistry {
  private games: Map<string, RegisteredGame> = new Map()

  /**
   * Enregistre un nouveau jeu dans le registre
   */
  register(game: RegisteredGame): void {
    if (this.games.has(game.gameType)) {
      console.warn(`Le jeu "${game.gameType}" est déjà enregistré. Il sera remplacé.`)
    }
    this.games.set(game.gameType, game)
    console.log(`✅ Jeu "${game.name}" (${game.gameType}) enregistré avec succès`)
  }

  /**
   * Récupère un jeu par son type
   */
  get(gameType: string): RegisteredGame | undefined {
    return this.games.get(gameType)
  }

  /**
   * Vérifie si un type de jeu est enregistré
   */
  has(gameType: string): boolean {
    return this.games.has(gameType)
  }

  /**
   * Liste tous les jeux enregistrés
   */
  list(): RegisteredGame[] {
    return Array.from(this.games.values())
  }

  /**
   * Récupère tous les types de jeux disponibles
   */
  getGameTypes(): string[] {
    return Array.from(this.games.keys())
  }
}

// Instance singleton du registre
export const gameRegistry = new GameRegistry()

// Enregistrement des jeux existants
gameRegistry.register({
  gameType: 'matching',
  name: 'Jeu de correspondance (cartes)',
  description: 'Associez les cartes par paires',
  component: CardMatchingGame,
  validateConfig: (config) => {
    return Array.isArray(config.pairs) && config.pairs.length > 0
  }
})

gameRegistry.register({
  gameType: 'column-matching',
  name: 'Jeu de correspondance (colonnes)',
  description: 'Associez les éléments des deux colonnes',
  component: ColumnMatchingGame,
  validateConfig: (config) => {
    return (
      Array.isArray(config.leftColumn) &&
      Array.isArray(config.rightColumn) &&
      Array.isArray(config.correctMatches) &&
      config.leftColumn.length > 0 &&
      config.rightColumn.length > 0
    )
  }
})

gameRegistry.register({
  gameType: 'connection',
  name: 'Jeu de connexion avec lignes animées',
  description: 'Connectez les éléments de deux colonnes avec des lignes animées',
  component: ConnectionGame,
  validateConfig: (config) => {
    const isValid = (
      Array.isArray(config.leftColumn) &&
      Array.isArray(config.rightColumn) &&
      Array.isArray(config.correctMatches) &&
      config.leftColumn.length > 0 &&
      config.rightColumn.length > 0
    )
    
    // Log de débogage en cas d'erreur
    if (!isValid && process.env.NODE_ENV === 'development') {
      console.warn('[ConnectionGame] Configuration invalide:', {
        hasLeftColumn: Array.isArray(config.leftColumn),
        leftColumnLength: config.leftColumn?.length,
        hasRightColumn: Array.isArray(config.rightColumn),
        rightColumnLength: config.rightColumn?.length,
        hasCorrectMatches: Array.isArray(config.correctMatches),
        correctMatchesLength: config.correctMatches?.length,
        configKeys: Object.keys(config),
        config: config
      })
    }
    
    return isValid
  }
})

gameRegistry.register({
  gameType: 'timeline',
  name: 'Jeu de timeline chronologique',
  description: 'Placez les événements dans l\'ordre chronologique',
  component: TimelineGame,
  validateConfig: (config) => {
    return (
      Array.isArray(config.events) &&
      (Array.isArray(config.correctOrder) || typeof config.correctOrder === 'object') &&
      config.events.length > 0
    )
  }
})

gameRegistry.register({
  gameType: 'category',
  name: 'Jeu de classification',
  description: 'Classez les items dans les bonnes catégories',
  component: CategoryGame,
  validateConfig: (config) => {
    return (
      Array.isArray(config.categories) &&
      Array.isArray(config.items) &&
      Array.isArray(config.correctCategories) &&
      config.categories.length > 0 &&
      config.items.length > 0
    )
  }
})

gameRegistry.register({
  gameType: 'api-types',
  name: 'Quel type d\'API utiliser ?',
  description: 'Choisissez le type d\'API approprié pour chaque scénario',
  component: ApiTypesGame,
  validateConfig: (config) => {
    return (
      Array.isArray(config.apiTypes) &&
      Array.isArray(config.scenarios) &&
      config.apiTypes.length > 0 &&
      config.scenarios.length > 0
    )
  }
})

gameRegistry.register({
  gameType: 'format-files',
  name: 'Formats de fichiers (JSON/XML/Protobuf)',
  description: 'Apprenez à reconnaître et utiliser les formats JSON, XML et Protobuf',
  component: FormatFilesGame,
  validateConfig: (config) => {
    return Array.isArray(config.levels) && config.levels.length > 0
  }
})

gameRegistry.register({
  gameType: 'json-file-types',
  name: 'Types de fichiers JSON',
  description: 'Apprenez à reconnaître les différents types de fichiers JSON (package.json, tsconfig.json, etc.)',
  component: JsonFileTypesGame,
  validateConfig: (config) => {
    return (
      Array.isArray(config.fileTypes) &&
      Array.isArray(config.examples) &&
      config.fileTypes.length > 0 &&
      config.examples.length > 0
    )
  }
})

gameRegistry.register({
  gameType: 'scenario',
  name: 'Jeu de scénario',
  description: 'Parcourez un scénario interactif avec des décisions et leurs conséquences',
  component: ScenarioGame,
  validateConfig: (config) => {
    // Les chapitres sont gérés séparément, donc on accepte n'importe quelle config
    return true
  }
})

gameRegistry.register({
  gameType: 'quiz',
  name: 'Quiz interactif',
  description: 'Répondez aux questions pour tester vos connaissances',
  component: QuizGame,
  validateConfig: (config) => {
    return Array.isArray(config.levels) && config.levels.length > 0
  }
})

gameRegistry.register({
  gameType: 'api-builder',
  name: 'API Builder - Constructeur de routes REST',
  description: 'Construisez des routes REST en glissant-déposant des blocs',
  component: ApiBuilderGame,
  validateConfig: (config) => {
    // La configuration est optionnelle, on peut utiliser les valeurs par défaut
    return true
  }
})

gameRegistry.register({
  gameType: 'graphql-query-builder',
  name: 'GraphQL Query Builder - Constructeur de requêtes GraphQL',
  description: 'Construisez des requêtes GraphQL en glissant-déposant des champs',
  component: GraphQLQueryBuilder,
  validateConfig: (config) => {
    // La configuration est optionnelle, on peut utiliser les valeurs par défaut
    return true
  }
})

gameRegistry.register({
  gameType: 'api-paradigms',
  name: 'Mini-jeu : Comparer les paradigmes d\'API',
  description: 'Mini-jeu interactif React pour comparer les performances et usages des paradigmes d\'API. Inclut Quiz, Drag & Drop, Classement et Support de révision.',
  component: ApiParadigmsGame,
  validateConfig: (config) => {
    // La configuration est optionnelle, on peut utiliser les valeurs par défaut
    // Mais si elle est fournie, on vérifie que les structures sont correctes
    if (config.paradigms && !Array.isArray(config.paradigms)) return false
    if (config.useCases && !Array.isArray(config.useCases)) return false
    if (config.rankings && typeof config.rankings !== 'object') return false
    return true
  }
})

gameRegistry.register({
  gameType: 'websocket-quiz',
  name: 'WebSocket — Auto-test',
  description: 'Mini-jeu WebSocket — Auto-évaluation (intermédiaire) avec QCM, Vrai-Faux et Debug',
  component: WebSocketQuizGame,
  validateConfig: (config) => {
    // Vérifier que modes existe et contient au moins un mode
    if (!config.modes || typeof config.modes !== 'object') return false
    const hasQcm = config.modes.qcm && Array.isArray(config.modes.qcm.questions) && config.modes.qcm.questions.length > 0
    const hasTf = config.modes.vrai_faux && Array.isArray(config.modes.vrai_faux.questions) && config.modes.vrai_faux.questions.length > 0
    const hasDebug = config.modes.debug && Array.isArray(config.modes.debug.questions) && config.modes.debug.questions.length > 0
    return hasQcm || hasTf || hasDebug
  }
})

/**
 * Fonction utilitaire pour extraire le game_content réel
 * (gère les cas où game_content est imbriqué)
 */
export function extractGameContent(gameContent: any): GameConfig | null {
  if (!gameContent) return null

  // Si game_content est une chaîne JSON, la parser
  if (typeof gameContent === 'string') {
    try {
      gameContent = JSON.parse(gameContent)
    } catch (e) {
      console.error('Erreur lors du parsing de game_content:', e)
      return null
    }
  }

  // Si ce n'est pas un objet, retourner null
  if (typeof gameContent !== 'object' || Array.isArray(gameContent)) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[extractGameContent] gameContent n\'est pas un objet:', {
        type: typeof gameContent,
        isArray: Array.isArray(gameContent),
        value: gameContent
      })
    }
    return null
  }

  // Si game_content contient un objet avec game_content à l'intérieur (structure imbriquée pour chapitres)
  if (gameContent.game_content && typeof gameContent.game_content === 'object') {
    return extractGameContent(gameContent.game_content)
  }

  // Si game_content contient un objet avec content à l'intérieur (structure imbriquée pour items)
  // Exemple: { type: "game", title: "...", content: { gameType: "connection", ... } }
  if (gameContent.content && typeof gameContent.content === 'object') {
    // Si content est une chaîne, la parser
    if (typeof gameContent.content === 'string') {
      try {
        gameContent.content = JSON.parse(gameContent.content)
      } catch (e) {
        console.error('Erreur lors du parsing de content:', e)
        return null
      }
    }
    // Si content contient gameType, utiliser content
    if (gameContent.content.gameType) {
      return extractGameContent(gameContent.content)
    }
  }

  // Vérifier que gameType existe
  if (!gameContent.gameType) {
    // Log de débogage pour comprendre la structure
    if (process.env.NODE_ENV === 'development') {
      console.warn('[extractGameContent] gameType manquant, structure reçue:', {
        keys: Object.keys(gameContent),
        hasContent: !!gameContent.content,
        hasGameContent: !!gameContent.game_content,
        gameContentType: typeof gameContent,
        contentType: typeof gameContent.content,
        sample: JSON.stringify(gameContent).substring(0, 300)
      })
    }
    return null
  }

  // Vérifier que les arrays sont bien des arrays (pas des chaînes)
  if (gameContent.leftColumn && typeof gameContent.leftColumn === 'string') {
    try {
      gameContent.leftColumn = JSON.parse(gameContent.leftColumn)
    } catch (e) {
      console.error('Erreur lors du parsing de leftColumn:', e)
    }
  }
  if (gameContent.rightColumn && typeof gameContent.rightColumn === 'string') {
    try {
      gameContent.rightColumn = JSON.parse(gameContent.rightColumn)
    } catch (e) {
      console.error('Erreur lors du parsing de rightColumn:', e)
    }
  }
  if (gameContent.correctMatches && typeof gameContent.correctMatches === 'string') {
    try {
      gameContent.correctMatches = JSON.parse(gameContent.correctMatches)
    } catch (e) {
      console.error('Erreur lors du parsing de correctMatches:', e)
    }
  }

  return gameContent as GameConfig
}

