import DOMPurify from 'dompurify'
import { JSDOM } from 'jsdom'

// Configurar DOMPurify para server-side
const window = new JSDOM('').window
const DOMPurifyServer = DOMPurify(window as any)

/**
 * Sanitiza string HTML para prevenir XSS
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return ''
  return DOMPurifyServer.sanitize(input, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: []
  })
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