import 'server-only';

import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

/**
 * Markdown escrito por profesores -> HTML seguro. Se sanea en el servidor:
 * nada de <script>, estilos en linea ni atributos de eventos, y los enlaces
 * externos abren con rel="noopener noreferrer".
 */
export function markdownSeguro(texto: string) {
  const html = marked.parse(texto, { async: false, gfm: true, breaks: false }) as string;
  return sanitizeHtml(html, {
    allowedTags: ['h2', 'h3', 'h4', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'code', 'pre', 'blockquote', 'a', 'br', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
    allowedAttributes: { a: ['href', 'title', 'rel', 'target'], th: ['scope'] },
    allowedSchemes: ['https', 'http', 'mailto'],
    transformTags: {
      // Un h1 dentro del contenido romperia la jerarquia de encabezados de la pagina.
      h1: 'h2',
      a: (tag, attribs) => ({
        tagName: 'a',
        attribs: attribs.href?.startsWith('http')
          ? { ...attribs, target: '_blank', rel: 'noopener noreferrer' }
          : attribs,
      }),
    },
  });
}

/** Texto plano (para leer en voz alta o resumir). */
export function textoPlano(markdown: string) {
  return sanitizeHtml(marked.parse(markdown, { async: false }) as string, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ').trim();
}
