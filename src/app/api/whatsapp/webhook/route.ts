import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendCancelledWhatsApp, sendConfirmedWhatsApp } from "@/lib/whatsapp"
import { normalizePhoneDigits, normalizeWhatsAppReply } from "@/lib/whatsapp-utils"
import logger from "@/lib/logging/logger"

function resolveAppointmentTimestamp(item: {
  data: string
  horario: string
  createdAt: Date
}) {
  const parsed = new Date(`${item.data}T${item.horario}:00`)
  if (Number.isNaN(parsed.getTime())) return item.createdAt.getTime()
  return parsed.getTime()
}

function findPendingAppointmentByPhone(
  items: Array<{
    id: number
    telefone: string | null
    data: string
    horario: string
    createdAt: Date
    pacienteNome: string | null
  }>,
  incomingPhone: string
) {
  logger.debug("[WEBHOOK] Procurando agendamento", {
    incomingPhone,
    totalItems: items.length,
    phonesArmazenados: items.map(item => ({
      id: item.id,
      telefone: item.telefone,
      normalizado: normalizePhoneDigits(item.telefone ?? "")
    }))
  })
  
  const exactMatches = items.filter((item) => normalizePhoneDigits(item.telefone ?? "") === incomingPhone)
  
  logger.debug("[WEBHOOK] Busca exata", {
    encontrados: exactMatches.length,
    ids: exactMatches.map(m => m.id)
  })
  
  if (exactMatches.length > 0) {
    return [...exactMatches].sort((a, b) => resolveAppointmentTimestamp(a) - resolveAppointmentTimestamp(b))[0]
  }

  const suffixMatches = items.filter((item) => {
    const itemPhone = normalizePhoneDigits(item.telefone ?? "")
    return itemPhone && itemPhone.slice(-10) === incomingPhone.slice(-10)
  })

  logger.debug("[WEBHOOK] Busca por sufixo", {
    encontrados: suffixMatches.length,
    ids: suffixMatches.map(m => m.id)
  })

  if (suffixMatches.length > 0) {
    return [...suffixMatches].sort((a, b) => resolveAppointmentTimestamp(a) - resolveAppointmentTimestamp(b))[0]
  }

  return null
}

export async function POST(req: Request) {
  try {
    const text = await req.text()
    const params = new URLSearchParams(text)

    const from = params.get("From") ?? ""
    const body = normalizeWhatsAppReply(params.get("Body") ?? "")
    const telefone = normalizePhoneDigits(from)

    logger.info("[WEBHOOK] Mensagem recebida", { from, body, telefone })

    const twiml = "<?xml version='1.0'?><Response></Response>"

    const todos = await db.agendamento.findMany({
      where: { status: "AguardandoConfirmacao" },
      orderBy: [{ data: "asc" }, { horario: "asc" }, { createdAt: "asc" }],
    })

    logger.debug("[WEBHOOK] Agendamentos pendentes carregados", {
      total: todos.length,
      agendamentos: todos.map((item: any) => ({ id: item.id, tel: item.telefone })),
    })

    const agendamento = findPendingAppointmentByPhone(todos, telefone)

    logger.debug("[WEBHOOK] Busca de agendamento", {
      telefoneIncoming: telefone,
      agendamentoEncontrado: agendamento?.id ?? null,
    })

    if (!agendamento) {
      logger.warn("[WEBHOOK] Nenhum agendamento encontrado para este telefone", { telefone })
      return new NextResponse(twiml, { headers: { "Content-Type": "text/xml" } })
    }

    if (["SIM", "S", "SS", "YES", "Y", "OK", "OKAY", "CONFIRMO", "CONFIRMADO"].includes(body)) {
      await db.agendamento.update({ where: { id: agendamento.id }, data: { status: "Confirmado" } })
      logger.info("[WEBHOOK] Agendamento confirmado", {
        agendamentoId: agendamento.id,
        paciente: agendamento.pacienteNome,
        data: agendamento.data,
        horario: agendamento.horario,
      })
      
      try {
        await sendConfirmedWhatsApp({
          to: telefone,
          paciente: agendamento.pacienteNome!,
          data: agendamento.data,
          horario: agendamento.horario,
        })
        logger.info("[WEBHOOK] Mensagem de confirmação enviada", { telefone })
      } catch (whatsappError) {
        logger.error("[WEBHOOK] Erro ao enviar mensagem de confirmação", { telefone, error: whatsappError })
      }
    } else if (["NAO", "N", "NN", "NÃO", "NO", "CANCEL", "CANCELAR"].includes(body)) {
      await db.agendamento.update({ where: { id: agendamento.id }, data: { status: "Cancelado" } })
      logger.info("[WEBHOOK] Agendamento cancelado", {
        agendamentoId: agendamento.id,
        paciente: agendamento.pacienteNome,
      })
      
      try {
        await sendCancelledWhatsApp({
          to: telefone,
          paciente: agendamento.pacienteNome!,
        })
        logger.info("[WEBHOOK] Mensagem de cancelamento enviada", { telefone })
      } catch (whatsappError) {
        logger.error("[WEBHOOK] Erro ao enviar mensagem de cancelamento", { telefone, error: whatsappError })
      }
    } else {
      logger.warn("[WEBHOOK] Resposta não reconhecida", {
        telefone,
        respostaRecebida: body,
        agendasPendentes: todos.length,
      })
    }

    return new NextResponse(twiml, { headers: { "Content-Type": "text/xml" } })
  } catch (error) {
    logger.error("[WEBHOOK] Erro geral", { error })
    const twiml = "<?xml version='1.0'?><Response></Response>"
    return new NextResponse(twiml, { headers: { "Content-Type": "text/xml" } })
  }
}
