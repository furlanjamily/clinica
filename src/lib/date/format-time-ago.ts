export function formatTimeAgo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime()
  const minutes = Math.floor(diffMs / 60_000)

  if (minutes < 1) return "agora mesmo"
  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? "minuto" : "minutos"} atrás`
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours} ${hours === 1 ? "hora" : "horas"} atrás`
  }

  const days = Math.floor(hours / 24)
  return `${days} ${days === 1 ? "dia" : "dias"} atrás`
}
