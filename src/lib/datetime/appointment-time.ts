/**
 * Conversões de tempo do domínio clínico.
 *
 * O banco guarda `scheduledStart` como instante (timestamptz) — a fonte de
 * verdade. A UI continua trabalhando com `date` ("YYYY-MM-DD") e `slotTime`
 * ("HH:mm") no fuso da clínica (America/Sao_Paulo, UTC-3, sem horário de verão).
 *
 * Centralizamos a conversão aqui para evitar comparação lexicográfica de datas
 * em string e inconsistências de fuso espalhadas pelo código.
 */

const CLINIC_OFFSET_MS = 3 * 60 * 60 * 1000 // UTC-3

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^\d{2}:\d{2}$/

/** Combina data + horário locais (clínica) em um instante absoluto. */
export function combineLocalDateTime(date: string, slotTime: string): Date {
  if (!DATE_RE.test(date)) throw new Error(`Data inválida: ${date}`)
  if (!TIME_RE.test(slotTime)) throw new Error(`Horário inválido: ${slotTime}`)
  return new Date(`${date}T${slotTime}:00.000-03:00`)
}

function localFields(instant: Date): Date {
  // Desloca o instante para que os campos UTC representem a hora local da clínica.
  return new Date(instant.getTime() - CLINIC_OFFSET_MS)
}

/** Deriva "YYYY-MM-DD" no fuso da clínica a partir de um instante. */
export function toLocalDate(instant: Date): string {
  return localFields(instant).toISOString().slice(0, 10)
}

/** Deriva "HH:mm" no fuso da clínica a partir de um instante. */
export function toLocalSlotTime(instant: Date): string {
  return localFields(instant).toISOString().slice(11, 16)
}

/** Início do dia local (clínica) como instante absoluto. */
export function startOfLocalDay(date: string): Date {
  return combineLocalDateTime(date, "00:00")
}

/** Início do dia seguinte (exclusivo) — útil para ranges `lt`. */
export function startOfNextLocalDay(date: string): Date {
  const start = startOfLocalDay(date)
  return new Date(start.getTime() + 24 * 60 * 60 * 1000)
}

/** Converte "YYYY-MM-DD" em um `Date` (00:00 local) para colunas `@db.Date`. */
export function localDateOnly(date: string): Date {
  return startOfLocalDay(date)
}

/** Converte um `Date` de coluna `@db.Date` de volta para "YYYY-MM-DD". */
export function dateOnlyToString(value: Date | null | undefined): string | null {
  if (!value) return null
  return value.toISOString().slice(0, 10)
}
