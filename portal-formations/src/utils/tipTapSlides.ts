/**
 * Utilitaires pour extraire les éléments individuels d'un contenu TipTap
 * et les transformer en slides pour la projection
 */

export interface SlideElement {
  id: string
  type: string
  content: any
  chapterTitle: string
  chapterIndex: number
  elementIndex: number
}

/**
 * Extrait tous les éléments individuels d'un contenu TipTap qui peuvent être affichés comme slides
 * Les éléments extraits sont : headings, paragraphs, bulletList, orderedList, blockquote, codeBlock, horizontalRule
 */
export function extractSlideElements(
  chapters: Array<{ id: string; title: string; content: any }>
): SlideElement[] {
  const slides: SlideElement[] = []
  
  console.log('extractSlideElements called with chapters:', chapters.length)
  
  chapters.forEach((chapter, chapterIndex) => {
    console.log(`Processing chapter ${chapterIndex}:`, {
      id: chapter.id,
      title: chapter.title,
      hasContent: !!chapter.content,
      contentType: typeof chapter.content,
      contentKeys: chapter.content ? Object.keys(chapter.content) : []
    })
    
    if (!chapter.content) {
      console.log(`Chapter ${chapterIndex} has no content, skipping`)
      return
    }
    
    // Gérer le cas où content est directement un objet TipTap
    let contentArray: any[] = []
    if (chapter.content.content && Array.isArray(chapter.content.content)) {
      contentArray = chapter.content.content
      console.log(`Found content.content array with ${contentArray.length} elements`)
    } else if (Array.isArray(chapter.content)) {
      contentArray = chapter.content
      console.log(`Content is directly an array with ${contentArray.length} elements`)
    } else if (typeof chapter.content === 'object' && chapter.content.type === 'doc') {
      contentArray = chapter.content.content || []
      console.log(`Found doc type with content array of ${contentArray.length} elements`)
    } else {
      console.warn(`Could not extract content array from chapter ${chapterIndex}`, chapter.content)
    }
    
    if (contentArray.length === 0) {
      console.log(`Chapter ${chapterIndex} has empty content array, skipping`)
      return
    }
    
    let elementIndex = 0
    
    contentArray.forEach((element: any, idx: number) => {
      console.log(`  Element ${idx}:`, {
        type: element.type,
        hasContent: !!element.content,
        contentLength: element.content ? (Array.isArray(element.content) ? element.content.length : 'not array') : 0
      })
      
      // Ignorer les hardBreak seuls
      if (element.type === 'hardBreak') {
        return
      }
      
      // Types d'éléments qui peuvent être des slides
      const slideableTypes = [
        'heading',
        'paragraph',
        'bulletList',
        'orderedList',
        'blockquote',
        'codeBlock',
        'horizontalRule',
        'table',
        'image',
        'youtube',
        'carousel',
        'htmlBlock'
      ]
      
      // Si c'est un type slideable ou un type inconnu mais avec du contenu
      if (slideableTypes.includes(element.type) || (element.type && element.content)) {
        // Créer un document TipTap minimal avec juste cet élément
        const slideContent = {
          type: 'doc',
          content: [element]
        }
        
        console.log(`  Creating slide for element ${idx} (type: ${element.type})`)
        
        slides.push({
          id: `${chapter.id}-${elementIndex}`,
          type: element.type || 'unknown',
          content: slideContent,
          chapterTitle: chapter.title,
          chapterIndex,
          elementIndex
        })
        
        elementIndex++
      } else {
        console.log(`  Skipping element ${idx} (type: ${element.type}, not slideable)`)
      }
    })
  })
  
  console.log(`Total slides extracted: ${slides.length}`)
  return slides
}

/**
 * Extrait le texte d'un nœud TipTap récursivement
 */
function extractTextFromNode(node: any): string {
  if (!node) return ''
  
  if (node.type === 'text') {
    return node.text || ''
  }
  
  if (node.content && Array.isArray(node.content)) {
    return node.content.map((child: any) => extractTextFromNode(child)).join('')
  }
  
  return ''
}

/**
 * Obtient le titre d'affichage pour une slide
 */
export function getSlideTitle(slide: SlideElement): string | null {
  // Si c'est un heading, extraire son texte
  if (slide.type === 'heading' && slide.content?.content?.[0]) {
    const headingElement = slide.content.content[0]
    const headingText = extractTextFromNode(headingElement)
    if (headingText) return headingText
  }
  
  // Si c'est un paragraph, extraire le texte pour l'afficher comme titre
  if (slide.type === 'paragraph' && slide.content?.content?.[0]) {
    const paragraphElement = slide.content.content[0]
    const paragraphText = extractTextFromNode(paragraphElement)
    if (paragraphText) {
      // Limiter à 100 caractères pour le titre
      return paragraphText.length > 100 ? paragraphText.substring(0, 100) + '...' : paragraphText
    }
  }
  
  // Pour les autres types, ne pas afficher de titre (sera géré dans le composant)
  return null
}

