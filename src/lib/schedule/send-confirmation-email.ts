import logger from "@/lib/logging/logger"
import { db } from "@/lib/db"
import { createOrRefreshConfirmationToken } from "@/lib/schedule/email-confirmation"
import { getAppBaseUrl, getResendClient, getResendFrom, getResendReplyTo } from "@/lib/email/resend"

export async function sendAppointmentConfirmationEmail(agendamentoId: number) {
  const agendamento = await db.agendamento.findUnique({
    where: { id: agendamentoId },
    include: { paciente: true, medico: true },
  })

  if (!agendamento) return { ok: false as const, reason: "not_found" as const }

  const email = agendamento.paciente.email?.trim()
  if (!email) return { ok: false as const, reason: "no_email" as const }

  const { token, expiresAt } = await createOrRefreshConfirmationToken({
    agendamentoId: agendamento.id,
    sentToEmail: email,
  })

  const baseUrl = getAppBaseUrl()
  const simUrl = new URL("/api/schedule/confirm", baseUrl)
  simUrl.searchParams.set("token", token)
  simUrl.searchParams.set("action", "confirm")

  const naoUrl = new URL("/api/schedule/confirm", baseUrl)
  naoUrl.searchParams.set("token", token)
  naoUrl.searchParams.set("action", "cancel")

  const resend = getResendClient()
  const from = getResendFrom()
  const replyTo = getResendReplyTo()

  // marca como aguardando confirmação (se ainda estiver pendente)
  if (agendamento.status === "Agendado") {
    await db.agendamento.update({
      where: { id: agendamento.id },
      data: { status: "AguardandoConfirmacao" },
    })
  }

  const subject = "Confirmação de consulta"
  const pacienteNome = agendamento.paciente.nome ?? "Paciente"
  const medicoNome = agendamento.medico.nome ?? agendamento.profissionalNome ?? "Profissional"
  const when = `${agendamento.data} às ${agendamento.horario}`

  const text = [
    `Olá, ${pacienteNome}!`,
    "",
    `Você confirma sua consulta com ${medicoNome} em ${when}?`,
    "",
    `SIM: ${simUrl.toString()}`,
    `NÃO: ${naoUrl.toString()}`,
    "",
    `Esse link expira em ${expiresAt.toISOString()}.`,
    "",
    "Se você não solicitou essa confirmação, ignore este e-mail.",
  ].join("\n")

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <p>Olá, <strong>${escapeHtml(pacienteNome)}</strong>!</p>
      <p>Você confirma sua consulta com <strong>${escapeHtml(medicoNome)}</strong> em <strong>${escapeHtml(when)}</strong>?</p>
      <p>
        <a href="${simUrl.toString()}" style="display:inline-block;padding:10px 14px;background:#0f766e;color:#fff;text-decoration:none;border-radius:8px;margin-right:10px;">
          Sim, confirmar
        </a>
        <a href="${naoUrl.toString()}" style="display:inline-block;padding:10px 14px;background:#b91c1c;color:#fff;text-decoration:none;border-radius:8px;">
          Não, cancelar
        </a>
      </p>
      <p style="color:#6b7280;font-size:12px">Esse link expira em ${expiresAt.toISOString()}.</p>
    </div>
  `

  try {
    await resend.emails.send({
      from,
      to: email,
      subject,
      text,
      html,
      ...(replyTo ? { replyTo } : {}),
    })
    return { ok: true as const }
  } catch (err) {
    logger.error("Failed to send confirmation email", { err, agendamentoId })
    return { ok: false as const, reason: "send_failed" as const }
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

