export function sanitizePhone(input: string): string {
  if (typeof input !== 'string') return ''
  return input.replace(/[^\d+\-\s()]/g, '').trim()
}

export function sanitizeName(input: string): string {
  if (typeof input !== 'string') return ''
  return input.replace(/[^a-zA-ZÀ-ÿ\s\-']/g, '').trim()
}
