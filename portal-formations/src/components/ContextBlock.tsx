import { RichTextEditor } from './RichTextEditor'
import { MessageSquare } from 'lucide-react'

interface ContextBlockProps {
  context?: {
    body?: any // Format TipTap JSON
    text?: string // Texte simple
    description?: string
  }
  theme: {
    primaryColor: string
    secondaryColor: string
    fontFamily?: string
  }
}

/**
 * Composant pour afficher le contexte pédagogique sous une slide
 * Visuellement distinct, légèrement indenté, aspect "annotation formateur"
 */
export function ContextBlock({ context, theme }: ContextBlockProps) {
  // Si aucun contexte n'est fourni, ne rien afficher
  if (!context || (!context.body && !context.text && !context.description)) {
    return null
  }

  return (
    <div className="context-block mt-4 mb-6">
      <div 
        className="ml-8 md:ml-12 p-4 rounded-lg border-l-4 shadow-sm"
        style={{
          backgroundColor: '#F9FAFB',
          borderLeftColor: theme.primaryColor,
          borderLeftWidth: '4px'
        }}
      >
        {/* Icône et titre optionnel */}
        <div className="flex items-center space-x-2 mb-3">
          <MessageSquare 
            className="w-5 h-5 flex-shrink-0" 
            style={{ color: theme.primaryColor }}
          />
          <h4 
            className="text-sm font-semibold uppercase tracking-wide"
            style={{ color: theme.primaryColor }}
          >
            Contexte pédagogique
          </h4>
        </div>

        {/* Contenu du contexte */}
        <div className="context-content text-gray-700">
          {context.body ? (
            // Format TipTap JSON
            <div className="prose prose-sm max-w-none">
              <RichTextEditor
                content={context.body}
                onChange={() => {}}
                editable={false}
              />
            </div>
          ) : context.text ? (
            // Texte simple avec préservation des sauts de ligne
            <div className="prose prose-sm max-w-none whitespace-pre-wrap">
              {context.text}
            </div>
          ) : context.description ? (
            // Description simple
            <p className="text-sm leading-relaxed">{context.description}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

