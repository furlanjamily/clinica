export function gerarHorarios(turno?: string | null, data?: string): string[] {
  const slots: string[] = []

  let isSabado = false
  let isDomingo = false
  if (data) {
    const date = new Date(data + 'T00:00:00')
    const dayOfWeek = date.getUTCDay()
    isDomingo = dayOfWeek === 0
    isSabado = dayOfWeek === 6
  }

  if (isDomingo) {
    return []
  }

  const ranges =
    turno === "Manhã"
      ? [[8, 0, 12, 0]]
      : turno === "Tarde"
        ? [[13, 0, 17, 30]]
        : [
            [8, 0, 12, 0],
            [13, 0, 17, 30],
          ]

  for (const [sh, sm, eh, em] of ranges) {
    let h = sh
    let m = sm

    let endHour = eh
    let endMin = em
    if (isSabado && eh > 12) {
      endHour = 12
      endMin = 0
    }

    while (h < endHour || (h === endHour && m <= endMin)) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`)
      m += 30
      if (m >= 60) {
        m = 0
        h++
      }
    }
  }
  return slots
}
