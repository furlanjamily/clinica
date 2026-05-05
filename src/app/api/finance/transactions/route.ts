import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { toAppointment } from "@/lib/schedule/map-atendimento"
import {
  CreateTransacaoSchema,
  isReceitaConsultaOuRetorno,
  valorCoerenteComTabela,
} from "@/lib/validations/finance-transaction"
import { handleApiError } from "@/lib/errors/error-handler"
import { ValidationError, ConflictError } from "@/lib/errors/custom-errors"

const agendamentoInclude = {
  paciente: true,
  medico: true,
  prontuario: {
    include: {
      paciente: true,
      agendamento: true,
    },
  },
  transacao: true,
} as const

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const mes = searchParams.get("mes")
    const tipo = searchParams.get("tipo")

    const where: Record<string, unknown> = {}
    if (mes) where.data = { startsWith: mes }
    if (tipo) where.tipo = tipo

    const transacoes = await db.transacao.findMany({
      where,
      orderBy: { data: "desc" },
      include: { agendamento: true },
    })
    return NextResponse.json(transacoes)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: Request) {
  try {
    const raw = await req.json()
    const parsed = CreateTransacaoSchema.safeParse(raw)
    if (!parsed.success) {
      throw new ValidationError("Dados inválidos", parsed.error.issues)
    }

    const body = parsed.data

    if (body.agendamentoId == null) {
      const transacao = await db.transacao.create({
        data: {
          tipo: body.tipo,
          categoria: body.categoria,
          descricao: body.descricao,
          valor: body.valor,
          data: body.data,
          formaPagamento: body.formaPagamento ?? undefined,
          status: body.status,
        },
      })
      return NextResponse.json(transacao, { status: 201 })
    }

    const agendamentoId = body.agendamentoId

    const result = await db.$transaction(async (tx) => {
      const ag = await tx.agendamento.findUnique({
        where: { id: agendamentoId },
        include: { transacao: true },
      })

      if (!ag) {
        throw new ValidationError("Agendamento não encontrado.")
      }

      if (ag.status !== "RegistrarChegada") {
        throw new ValidationError(
          "Só é possível registrar pagamento vinculado quando o agendamento está em «Registrar chegada»."
        )
      }

      if (ag.transacao) {
        throw new ConflictError("Este agendamento já possui transação vinculada.")
      }

      if (body.tipo !== "Receita") {
        throw new ValidationError("O pagamento da consulta deve ser uma receita.")
      }

      if (!isReceitaConsultaOuRetorno(body.categoria)) {
        throw new ValidationError("Para pagamento de consulta, a categoria deve ser Consulta ou Retorno.")
      }

      if (body.status !== "Confirmado") {
        throw new ValidationError("Para liberar o atendimento, o status da transação deve ser Confirmado.")
      }

      if (!body.formaPagamento?.trim()) {
        throw new ValidationError("Informe a forma de pagamento.")
      }

      const config = await tx.configuracaoFinanceira.findFirst()
      if (!config) {
        throw new ValidationError("Configure valores de consulta/retorno em Financeiro antes de registrar o pagamento.")
      }

      const coerente = valorCoerenteComTabela(
        body.categoria,
        body.valor,
        config.valorConsulta,
        config.valorRetorno
      )
      if (!coerente.ok) {
        throw new ValidationError(coerente.message)
      }

      const transacao = await tx.transacao.create({
        data: {
          tipo: body.tipo,
          categoria: body.categoria,
          descricao: body.descricao,
          valor: body.valor,
          data: body.data,
          formaPagamento: body.formaPagamento,
          status: body.status,
          agendamentoId,
        },
      })

      const atualizado = await tx.agendamento.update({
        where: { id: agendamentoId },
        data: { status: "Pago" },
        include: agendamentoInclude,
      })

      return { transacao, agendamento: atualizado }
    })

    return NextResponse.json(
      {
        transacao: result.transacao,
        agendamento: toAppointment(result.agendamento),
      },
      { status: 201 }
    )
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, ...data } = await req.json()
    const transacao = await db.transacao.update({ where: { id }, data })
    return NextResponse.json(transacao)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json()
    await db.transacao.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
