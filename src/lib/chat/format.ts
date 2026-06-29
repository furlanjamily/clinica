import { format, isToday, isYesterday, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"

export function formatMessageTime(iso: string): string {
  const date = new Date(iso)
  return format(date, "HH:mm", { locale: ptBR })
}

export function formatConversationTime(iso: string | null): string {
  if (!iso) return ""
  const date = new Date(iso)
  if (isToday(date)) return format(date, "HH:mm", { locale: ptBR })
  if (isYesterday(date)) return "Ontem"
  return format(date, "d MMM", { locale: ptBR })
}

export function formatDaySeparator(iso: string): string {
  const date = new Date(iso)
  if (isToday(date)) return "Hoje"
  if (isYesterday(date)) return "Ontem"
  return format(date, "d MMM yyyy", { locale: ptBR })
}

export function shouldShowDaySeparator(current: string, previous: string | null): boolean {
  if (!previous) return true
  return !isSameDay(new Date(current), new Date(previous))
}

export function formatFileSize(bytes: number | null): string {
  if (bytes == null) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export { getInitials } from "@/lib/avatar/initials"

export function resolveJobTitle(role: string | null | undefined): string | null {
  if (!role) return null
  const map: Record<string, string> = {
    SUPER_ADMIN: "Administrador",
    ADMIN: "Recepção / Admin",
    MEDICO: "Médico(a)",
  }
  return map[role] ?? role
}
