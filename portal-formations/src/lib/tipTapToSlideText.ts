/**
 * Conversion TipTap → texte structuré pour la génération de slides.
 * Préserve les retours à la ligne, les listes à puces, les listes numérotées,
 * les titres et les paragraphes.
 */

/** Extraire le texte d'un nœud inline (texte, hardBreak → \n) */
function getTextFromInline(node: any): string {
  if (!node) return ''
  if (node.type === 'text' && node.text) return node.text
  if (node.type === 'hardBreak') return '\n'
  if (node.content && Array.isArray(node.content)) {
    return node.content.map((c: any) => getTextFromInline(c)).join('')
  }
  return ''
}

/** Texte d'un bloc (paragraph, heading, etc.) en gérant les hardBreak */
function getBlockText(node: any): string {
  const raw = getTextFromInline(node).trim()
  return raw
}

/**
 * Convertit un contenu TipTap (type doc) en liste de lignes structurées
 * pour affichage sur une slide : un élément par paragraphe, par puce, par titre.
 * Retours à la ligne préservés ; listes à puces avec "• " ; listes numérotées avec "1. ", "2. ", etc.
 */
export function tipTapToSlideLines(content: any): string[] {
  if (!content) return []
  const nodes = content.content ?? (typeof content === 'object' && content.type === 'doc' ? content.content : null)
  if (!Array.isArray(nodes)) return []

  const lines: string[] = []

  for (const node of nodes) {
    if (node.type === 'paragraph') {
      const t = getBlockText(node)
      if (t) lines.push(t)
    } else if (node.type === 'heading') {
      const t = getBlockText(node)
      if (t) lines.push(t)
    } else if (node.type === 'bulletList') {
      for (const item of node.content || []) {
        if (item.type === 'listItem' && item.content) {
          for (const child of item.content) {
            if (child.type === 'paragraph') {
              const t = getBlockText(child).trim()
              if (t) lines.push('• ' + t)
            }
          }
        }
      }
    } else if (node.type === 'orderedList') {
      let num = 1
      for (const item of node.content || []) {
        if (item.type === 'listItem' && item.content) {
          for (const child of item.content) {
            if (child.type === 'paragraph') {
              const t = getBlockText(child).trim()
              if (t) {
                lines.push(`${num}. ${t}`)
                num++
              }
            }
          }
        }
      }
    } else if (node.type === 'blockquote') {
      const t = getBlockText(node)
      if (t) lines.push('> ' + t.replace(/\n/g, '\n> '))
    } else if (node.type === 'hardBreak') {
      if (lines.length > 0 && lines[lines.length - 1] !== '') lines.push('')
    } else if (node.content && Array.isArray(node.content)) {
      const sub = tipTapToSlideLines({ type: 'doc', content: node.content })
      lines.push(...sub)
    }
  }

  return lines
}

/**
 * Convertit un contenu TipTap en markdown lisible pour Gamma / prompts.
 * Paragraphes séparés par \n\n ; listes avec • ou 1. ; titres sans ## pour alléger si besoin.
 */
export function tipTapToSlideMarkdown(content: any, options?: { headingPrefix?: string }): string {
  const lines = tipTapToSlideLines(content)
  const headingPrefix = options?.headingPrefix ?? ''
  const out: string[] = []
  let i = 0
  for (const line of lines) {
    if (line.startsWith('> ')) {
      out.push(line)
    } else if (/^\d+\.\s/.test(line)) {
      out.push(line)
    } else if (line.startsWith('• ')) {
      out.push(line)
    } else {
      out.push(headingPrefix + line)
    }
    i++
  }
  return out.join('\n\n').replace(/\n\n+/g, '\n\n').trim()
}
