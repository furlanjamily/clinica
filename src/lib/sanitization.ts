/**
 * Sanitiza string HTML para prevenir XSS.
 * Remove todas as tags não permitidas e atributos.
 * Implementação sem dependências externas (compatível com Edge/Vercel).
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return ''

  const ALLOWED_TAGS = new Set([
    'p', 'br', 'strong', 'em', 'u',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
  ])

  // Remove all attributes from tags, keep only allowed tags
  return input
    .replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (match, tag: string) => {
      const lower = tag.toLowerCase()
      if (!ALLOWED_TAGS.has(lower)) return ''
      // Self-closing or closing tag — keep without attributes
      return match.startsWith('</') ? `</${lower}>` : `<${lower}>`
    })
    .trim()
}

/**
 * Sanitiza input de texto simples (remove HTML tags)
 */
export function sanitizeText(input: string): string {
  if (typeof input !== 'string') return ''
  return input.replace(/<[^>]*>/g, '').trim()
}

/**
 * Sanitiza input de telefone (apenas números e caracteres permitidos)
 */
export function sanitizePhone(input: string): string {
  if (typeof input !== 'string') return ''
  return input.replace(/[^\d+\-\s()]/g, '').trim()
}

/**
 * Sanitiza input de nome (apenas letras, espaços e caracteres comuns)
 */
export function sanitizeName(input: string): string {
  if (typeof input !== 'string') return ''
  return input.replace(/[^a-zA-ZÀ-ÿ\s\-']/g, '').trim()
}
