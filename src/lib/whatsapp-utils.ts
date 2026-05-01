export function normalizePhoneDigits(raw: string): string {
  if (!raw?.trim()) return ""

  let normalized = raw.trim()
  if (normalized.toLowerCase().startsWith("whatsapp:")) {
    normalized = normalized.slice("whatsapp:".length)
  }

  const digits = normalized.replace(/\D/g, "")
  if (!digits) return ""

  if (digits.length === 10 || digits.length === 11) return `55${digits}`
  if (digits.startsWith("55")) return digits
  return digits
}

export function normalizeWhatsAppReply(raw: string): string {
  return raw
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
}
