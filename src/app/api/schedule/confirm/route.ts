import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { handleApiError } from "@/lib/errors/error-handler"
import { ValidationError } from "@/lib/errors/custom-errors"
import { consumeConfirmationTokenOrThrow } from "@/lib/schedule/email-confirmation"
import { getAppBaseUrl } from "@/lib/email/resend"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const token = url.searchParams.get("token")?.trim()
    if (!token) throw new ValidationError("Token obrigatório")

    const action = (url.searchParams.get("action") ?? "confirm").trim()
    if (action !== "confirm" && action !== "cancel") {
      throw new ValidationError("Ação inválida")
    }

    const { row } = await consumeConfirmationTokenOrThrow(token)
    const agendamento = row.agendamento

    // Só processa se ainda não foi cancelado/concluído
    if (agendamento.status === "Cancelado" || agendamento.status === "Concluido") {
      throw new ValidationError("Agendamento não pode ser alterado")
    }

    await db.agendamento.update({
      where: { id: agendamento.id },
      data: { status: action === "confirm" ? "Confirmado" : "Cancelado" },
    })

    // Redireciona pra uma página simples (ou pro app) com sucesso
    const baseUrl = getAppBaseUrl()
    const redirectTo = new URL("/confirmacao", baseUrl)
    redirectTo.searchParams.set("ok", "1")
    redirectTo.searchParams.set("id", String(agendamento.id))
    redirectTo.searchParams.set("action", action)
    return NextResponse.redirect(redirectTo)
  } catch (err) {
    // Em erro, redireciona com mensagem genérica (sem vazar detalhes)
    try {
      const baseUrl = getAppBaseUrl()
      const redirectTo = new URL("/confirmacao", baseUrl)
      redirectTo.searchParams.set("ok", "0")
      return NextResponse.redirect(redirectTo)
    } catch {
      return handleApiError(err)
    }
  }
}

