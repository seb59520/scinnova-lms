/**
 * Utilitaires pour convertir le contenu TipTap JSON en Markdown
 * Utilisé pour la génération de fichiers Markdown
 */

/**
 * Convertit un nœud TipTap en Markdown
 */
function tipTapNodeToMarkdown(node: any): string {
  if (!node || typeof node !== 'object') return '';

  switch (node.type) {
    case 'doc':
      if (node.content && Array.isArray(node.content)) {
        return node.content.map((child: any) => tipTapNodeToMarkdown(child)).join('');
      }
      return '';

    case 'paragraph':
      const paraContent = node.content
        ? node.content.map((child: any) => tipTapNodeToMarkdown(child)).join('')
        : '';
      return paraContent ? `${paraContent}\n\n` : '';

    case 'heading':
      const level = node.attrs?.level || 1;
      const headingContent = node.content
        ? node.content.map((child: any) => tipTapNodeToMarkdown(child)).join('')
        : '';
      const hashes = '#'.repeat(level);
      return `${hashes} ${headingContent.trim()}\n\n`;

    case 'text':
      let text = node.text || '';
      // Appliquer les marks (gras, italique, etc.)
      if (node.marks && Array.isArray(node.marks)) {
        // Appliquer les marks dans l'ordre inverse pour respecter la priorité
        const marks = [...node.marks].reverse();
        marks.forEach((mark: any) => {
          switch (mark.type) {
            case 'bold':
              text = `**${text}**`;
              break;
            case 'italic':
              text = `*${text}*`;
              break;
            case 'underline':
              text = `<u>${text}</u>`;
              break;
            case 'code':
              text = `\`${text}\``;
              break;
            case 'link':
              const href = mark.attrs?.href || '#';
              text = `[${text}](${href})`;
              break;
            case 'highlight':
              text = `==${text}==`;
              break;
          }
        });
      }
      return text;

    case 'hardBreak':
      return '\n';

    case 'bulletList':
      const bulletContent = node.content
        ? node.content.map((child: any) => tipTapNodeToMarkdown(child)).join('')
        : '';
      return bulletContent;

    case 'orderedList':
      const orderedContent = node.content
        ? node.content.map((child: any, index: number) => {
            const itemContent = tipTapNodeToMarkdown(child);
            return itemContent ? `${index + 1}. ${itemContent.replace(/^[-*]\s*/, '')}` : '';
          }).join('')
        : '';
      return orderedContent;

    case 'listItem':
      const itemContent = node.content
        ? node.content.map((child: any) => tipTapNodeToMarkdown(child)).join('').trim()
        : '';
      return itemContent ? `- ${itemContent}\n` : '';

    case 'blockquote':
      const quoteContent = node.content
        ? node.content.map((child: any) => tipTapNodeToMarkdown(child)).join('')
        : '';
      return quoteContent
        ? quoteContent
            .split('\n')
            .filter((line: string) => line.trim())
            .map((line: string) => `> ${line}`)
            .join('\n') + '\n\n'
        : '';

    case 'codeBlock':
      const codeContent = node.content
        ? node.content
            .filter((child: any) => child.type === 'text')
            .map((child: any) => child.text || '')
            .join('')
        : '';
      const language = node.attrs?.language || '';
      return `\`\`\`${language}\n${codeContent}\n\`\`\`\n\n`;

    case 'horizontalRule':
      return '---\n\n';

    case 'image':
      const src = node.attrs?.src || '';
      const alt = node.attrs?.alt || '';
      const title = node.attrs?.title || '';
      if (title) {
        return `![${alt}](${src} "${title}")\n\n`;
      }
      return `![${alt}](${src})\n\n`;

    case 'table':
      const tableContent = node.content
        ? node.content.map((child: any) => tipTapNodeToMarkdown(child)).join('')
        : '';
      return tableContent ? `${tableContent}\n` : '';

    case 'tableRow':
      const rowContent = node.content
        ? node.content.map((child: any) => tipTapNodeToMarkdown(child)).join('|')
        : '';
      return rowContent ? `|${rowContent}|\n` : '';

    case 'tableCell':
    case 'tableHeader':
      const cellContent = node.content
        ? node.content.map((child: any) => tipTapNodeToMarkdown(child)).join('').trim()
        : '';
      return ` ${cellContent} `;

    default:
      // Pour les nœuds non reconnus, essayer de récupérer le contenu
      if (node.content && Array.isArray(node.content)) {
        return node.content.map((child: any) => tipTapNodeToMarkdown(child)).join('');
      }
      return '';
  }
}

/**
 * Convertit un contenu TipTap JSON en Markdown
 * Limite la taille pour éviter les problèmes de mémoire
 */
export function tipTapToMarkdown(content: any, maxLength: number = 100000): string {
  if (!content) return '';

  // Si c'est déjà une string, la retourner telle quelle (avec limite)
  if (typeof content === 'string') {
    return content.length > maxLength ? content.substring(0, maxLength) + '\n\n... (contenu tronqué)' : content;
  }

  // Si c'est un objet TipTap
  if (typeof content === 'object') {
    const markdown = tipTapNodeToMarkdown(content);
    // Limiter la taille du Markdown généré
    if (markdown.length > maxLength) {
      return markdown.substring(0, maxLength) + '\n\n... (contenu tronqué)';
    }
    return markdown.trim();
  }

  return '';
}

/**
 * Convertit le contexte pédagogique en Markdown
 * Supporte text, body (TipTap), ou description
 * Limite la taille pour éviter les problèmes de mémoire
 */
export function pedagogicalContextToMarkdown(context: any, maxLength: number = 50000): string {
  if (!context) return '';

  if (context.body) {
    return tipTapToMarkdown(context.body, maxLength);
  }

  if (context.text) {
    // Préserver les sauts de ligne, mais limiter la taille
    let text = context.text;
    if (text.length > maxLength) {
      text = text.substring(0, maxLength) + '\n\n... (contenu tronqué)';
    }
    return text;
  }

  if (context.description) {
    return context.description.length > maxLength 
      ? context.description.substring(0, maxLength) + '\n\n... (contenu tronqué)'
      : context.description;
  }

  return '';
}
