import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { handleApiError } from "@/lib/errors/error-handler"
import { ValidationError } from "@/lib/errors/custom-errors"
import { sendAppointmentConfirmationEmail } from "@/lib/schedule/send-confirmation-email"

const BodySchema = z.object({
  id: z.number().int().positive(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = BodySchema.safeParse(body)
    if (!parsed.success) throw new ValidationError("Dados inválidos", parsed.error.issues)

    const agendamento = await db.agendamento.findUnique({
      where: { id: parsed.data.id },
      include: { paciente: true, medico: true },
    })

    if (!agendamento) throw new ValidationError("Agendamento não encontrado")

    const email = agendamento.paciente.email?.trim()
    if (!email) throw new ValidationError("Paciente sem e-mail cadastrado")

    const result = await sendAppointmentConfirmationEmail(agendamento.id)
    if (!result.ok) {
      throw new ValidationError("Não foi possível enviar o e-mail")
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
