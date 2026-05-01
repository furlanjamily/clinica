import type { Agendamento } from "@prisma/client"
import { db } from "@/lib/db"
import { sendConfirmationWhatsApp } from "@/lib/whatsapp"
import { normalizePhoneDigits } from "@/lib/whatsapp-utils"

const HOURS_BEFORE_REMINDER = 48

function resolveDestinationPhone(row: any): string {
  const t = row.telefone?.trim()
  if (t) return t
  return process.env.TWILIO_WHATSAPP_TO?.trim() ?? ""
}

export async function runWhatsAppReminders(rows: any[]): Promise<void> {
  const now = new Date()

  for (const row of rows) {
    if (row.status !== "Agendado" || row.whatsappSent) continue

    const appt = new Date(`${row.data}T${row.horario}:00`)
    const hoursUntil = (appt.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (hoursUntil > HOURS_BEFORE_REMINDER || hoursUntil <= 0) continue

    const to = resolveDestinationPhone(row)
    
    // Fallback to related data if fields are empty
    const pacienteNome = row.pacienteNome?.trim() || row.paciente?.nome || ""
    const profissionalNome = row.profissionalNome?.trim() || row.medico?.nome || ""
    
    if (!to || !pacienteNome) {
      console.error(
        `[BOT] Sem telefone ou paciente para lembrete (id ${row.id}). Defina telefone no paciente/agendamento ou TWILIO_WHATSAPP_TO no .env.`
      )
      continue
    }

    try {
      await sendConfirmationWhatsApp({
        to,
        paciente: pacienteNome,
        data: row.data,
        horario: row.horario,
        profissional: profissionalNome,
      })
      const normalizedPhone = normalizePhoneDigits(to)
      await db.agendamento.update({
        where: { id: row.id },
        data: {
          status: "AguardandoConfirmacao",
          whatsappSent: true,
          pacienteNome,
          profissionalNome,
          ...(normalizedPhone ? { telefone: normalizedPhone } : {}),
        },
      })
      console.log(`[BOT] WhatsApp enviado para ${pacienteNome}`)
      row.status = "AguardandoConfirmacao"
      row.whatsappSent = true
      if (normalizedPhone) row.telefone = normalizedPhone
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[BOT] Falha ao enviar WhatsApp para ${pacienteNome}:`, msg)
    }
  }
}
