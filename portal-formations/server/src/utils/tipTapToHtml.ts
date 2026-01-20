/**
 * Utilitaires pour convertir le contenu TipTap JSON en HTML
 * Utilisé pour la génération de PDF
 */

/**
 * Convertit un nœud TipTap en HTML
 */
function tipTapNodeToHtml(node: any): string {
  if (!node || typeof node !== 'object') return '';

  switch (node.type) {
    case 'doc':
      if (node.content && Array.isArray(node.content)) {
        return node.content.map((child: any) => tipTapNodeToHtml(child)).join('');
      }
      return '';

    case 'paragraph':
      const paraContent = node.content
        ? node.content.map((child: any) => tipTapNodeToHtml(child)).join('')
        : '';
      return `<p>${paraContent}</p>`;

    case 'heading':
      const level = node.attrs?.level || 1;
      const headingContent = node.content
        ? node.content.map((child: any) => tipTapNodeToHtml(child)).join('')
        : '';
      return `<h${level}>${headingContent}</h${level}>`;

    case 'text':
      let text = node.text || '';
      // Appliquer les marks (gras, italique, etc.)
      if (node.marks && Array.isArray(node.marks)) {
        node.marks.forEach((mark: any) => {
          switch (mark.type) {
            case 'bold':
              text = `<strong>${text}</strong>`;
              break;
            case 'italic':
              text = `<em>${text}</em>`;
              break;
            case 'underline':
              text = `<u>${text}</u>`;
              break;
            case 'code':
              text = `<code>${text}</code>`;
              break;
            case 'link':
              const href = mark.attrs?.href || '#';
              const escapedHref = escapeHtml(href);
              text = `<a href="${escapedHref}">${text}</a>`;
              break;
            case 'highlight':
              text = `<mark>${text}</mark>`;
              break;
          }
        });
      }
      return text;

    case 'hardBreak':
      return '<br>';

    case 'bulletList':
      const bulletContent = node.content
        ? node.content.map((child: any) => tipTapNodeToHtml(child)).join('')
        : '';
      return `<ul>${bulletContent}</ul>`;

    case 'orderedList':
      const orderedContent = node.content
        ? node.content.map((child: any) => tipTapNodeToHtml(child)).join('')
        : '';
      return `<ol>${orderedContent}</ol>`;

    case 'listItem':
      const itemContent = node.content
        ? node.content.map((child: any) => tipTapNodeToHtml(child)).join('')
        : '';
      return `<li>${itemContent}</li>`;

    case 'blockquote':
      const quoteContent = node.content
        ? node.content.map((child: any) => tipTapNodeToHtml(child)).join('')
        : '';
      return `<blockquote>${quoteContent}</blockquote>`;

    case 'codeBlock':
      const codeContent = node.content
        ? node.content
            .filter((child: any) => child.type === 'text')
            .map((child: any) => escapeHtml(child.text || ''))
            .join('')
        : '';
      const language = node.attrs?.language || '';
      return `<pre><code${language ? ` class="language-${language}"` : ''}>${codeContent}</code></pre>`;

    case 'horizontalRule':
      return '<hr>';

    case 'image':
      const src = node.attrs?.src || '';
      const alt = node.attrs?.alt || '';
      const title = node.attrs?.title || '';
      // Échapper les attributs pour éviter les problèmes
      const escapedSrc = escapeHtml(src);
      const escapedAlt = escapeHtml(alt);
      const escapedTitle = title ? escapeHtml(title) : '';
      return `<img src="${escapedSrc}" alt="${escapedAlt}"${escapedTitle ? ` title="${escapedTitle}"` : ''} />`;

    case 'table':
      const tableContent = node.content
        ? node.content.map((child: any) => tipTapNodeToHtml(child)).join('')
        : '';
      return `<table>${tableContent}</table>`;

    case 'tableRow':
      const rowContent = node.content
        ? node.content.map((child: any) => tipTapNodeToHtml(child)).join('')
        : '';
      return `<tr>${rowContent}</tr>`;

    case 'tableCell':
    case 'tableHeader':
      const cellContent = node.content
        ? node.content.map((child: any) => tipTapNodeToHtml(child)).join('')
        : '';
      const tag = node.type === 'tableHeader' ? 'th' : 'td';
      return `<${tag}>${cellContent}</${tag}>`;

    default:
      // Pour les nœuds non reconnus, essayer de récupérer le contenu
      if (node.content && Array.isArray(node.content)) {
        return node.content.map((child: any) => tipTapNodeToHtml(child)).join('');
      }
      return '';
  }
}

/**
 * Échappe les caractères HTML
 */
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Convertit un contenu TipTap JSON en HTML
 * Limite la taille pour éviter les problèmes de mémoire
 */
export function tipTapToHtml(content: any, maxLength: number = 100000): string {
  if (!content) return '';

  // Si c'est déjà une string, la retourner telle quelle (avec limite)
  if (typeof content === 'string') {
    const text = content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
    return `<p>${escapeHtml(text)}</p>`;
  }

  // Si c'est un objet TipTap
  if (typeof content === 'object') {
    const html = tipTapNodeToHtml(content);
    // Limiter la taille du HTML généré
    if (html.length > maxLength) {
      return html.substring(0, maxLength) + '<p><em>... (contenu tronqué)</em></p>';
    }
    return html;
  }

  return '';
}

/**
 * Convertit le contexte pédagogique en HTML
 * Supporte text, body (TipTap), ou description
 * Limite la taille pour éviter les problèmes de mémoire
 */
export function pedagogicalContextToHtml(context: any, maxLength: number = 50000): string {
  if (!context) return '';

  if (context.body) {
    return tipTapToHtml(context.body, maxLength);
  }

  if (context.text) {
    // Préserver les sauts de ligne, mais limiter la taille
    let text = context.text;
    if (text.length > maxLength) {
      text = text.substring(0, maxLength) + '\n... (contenu tronqué)';
    }
    const escapedText = escapeHtml(text);
    return escapedText.split('\n').map((line: string) => `<p>${line || '&nbsp;'}</p>`).join('');
  }

  if (context.description) {
    const desc = context.description.length > maxLength 
      ? context.description.substring(0, maxLength) + '...'
      : context.description;
    return `<p>${escapeHtml(desc)}</p>`;
  }

  return '';
}

