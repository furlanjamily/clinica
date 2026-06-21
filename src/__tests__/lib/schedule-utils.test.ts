// @vitest-environment node
import { formatDuration } from "@/lib/time/format-duration"
import { flattenAppointmentsByDay, normalizeDate, sortByTime } from "@/lib/schedule/group-by-day"
import { getPatientName, calcElapsedMs } from "@/lib/schedule/appointment-utils"
import type { Appointment } from "@/lib/schedule/types"

function appointment(overrides: Partial<Appointment>): Appointment {
  return {
    id: 1,
    date: "2026-06-10",
    slotTime: "09:00",
    status: "Agendado",
    patient: { id: 1, name: "Maria" },
    professionalName: "Dr(a). João",
    ...overrides,
  }
}

describe("formatDuration", () => {
  it("formata minutos e segundos", () => {
    expect(formatDuration(0)).toBe("00:00")
    expect(formatDuration(61_000)).toBe("01:01")
    expect(formatDuration(59_999)).toBe("00:59")
  })

  it("inclui horas quando passa de 1 hora", () => {
    expect(formatDuration(3_661_000)).toBe("1:01:01")
  })
})

describe("normalizeDate / sortByTime", () => {
  it("converte YYYY-MM-DD em Date local sem deslocamento de fuso", () => {
    const date = normalizeDate("2026-06-10")
    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(5)
    expect(date.getDate()).toBe(10)
  })

  it("ordena por horário do slot", () => {
    const a = appointment({ slotTime: "14:00" })
    const b = appointment({ slotTime: "09:00" })
    expect([a, b].sort(sortByTime).map((i) => i.slotTime)).toEqual(["09:00", "14:00"])
  })
})

describe("flattenAppointmentsByDay", () => {
  it("agrupa por dia com cabeçalhos e ordena por data e horário", () => {
    const items = [
      appointment({ id: 1, date: "2026-06-11", slotTime: "10:00" }),
      appointment({ id: 2, date: "2026-06-10", slotTime: "15:00" }),
      appointment({ id: 3, date: "2026-06-10", slotTime: "08:00" }),
    ]

    const rows = flattenAppointmentsByDay(items)

    // 2 cabeçalhos de dia + 3 linhas de dados
    expect(rows).toHaveLength(5)
    expect(rows[0].type).toBe("day")

    const dataRows = rows.filter((r) => r.type === "data")
    expect(dataRows.map((r) => r.id)).toEqual([3, 2, 1])
  })

  it("retorna lista vazia sem agendamentos", () => {
    expect(flattenAppointmentsByDay([])).toEqual([])
  })
})

describe("getPatientName", () => {
  it("prioriza o nome do paciente relacionado", () => {
    expect(getPatientName(appointment({}))).toBe("Maria")
  })

  it("usa fallback de patientName e padrão", () => {
    const noRelation = appointment({
      patient: undefined as unknown as Appointment["patient"],
      patientName: "José",
    })
    expect(getPatientName(noRelation)).toBe("José")

    const none = appointment({
      patient: undefined as unknown as Appointment["patient"],
      patientName: null,
    })
    expect(getPatientName(none)).toBe("Sem paciente")
  })
})

describe("calcElapsedMs", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("retorna o acumulado quando pausado", () => {
    const item = appointment({ accumulatedTime: 5000, pausedAt: "2026-06-10T10:00:00Z" })
    expect(calcElapsedMs(item)).toBe(5000)
  })

  it("soma o tempo desde o início quando em andamento", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-06-10T10:01:00Z"))

    const item = appointment({
      accumulatedTime: 1000,
      startTime: "2026-06-10T10:00:00Z",
    })

    expect(calcElapsedMs(item)).toBe(61_000)
  })

  it("retorna o acumulado quando não há startTime", () => {
    expect(calcElapsedMs(appointment({ accumulatedTime: 2000 }))).toBe(2000)
  })
})
