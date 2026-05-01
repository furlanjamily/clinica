import { db } from "@/lib/db"

export async function findAgendamentoConflict(
  medicoId: number,
  data: string,
  horario: string,
  excludeId?: number
) {
  return db.agendamento.findFirst({
    where: {
      medicoId,
      data,
      horario,
      status: { notIn: ["Cancelado", "Concluido"] },
      ...(excludeId != null ? { id: { not: excludeId } } : {}),
    },
  })
}
