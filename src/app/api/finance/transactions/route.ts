import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { toAppointment } from "@/lib/schedule/map-appointment"
import {
  CreateTransactionSchema,
  isConsultOrFollowUpCategory,
  amountMatchesFeeTable,
} from "@/lib/validations/finance-transaction"
import { handleApiError } from "@/lib/errors/error-handler"
import { ValidationError, ConflictError } from "@/lib/errors/custom-errors"

const appointmentWithRelations = {
  patient: true,
  doctor: true,
  clinicalChart: {
    include: {
      patient: true,
      appointment: true,
    },
  },
  transaction: true,
} as const

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const month = searchParams.get("mes")
    const type = searchParams.get("tipo")

    const where: Record<string, unknown> = {}
    if (month) where.date = { startsWith: month }
    if (type) where.type = type

    const transactions = await db.transaction.findMany({
      where,
      orderBy: { date: "desc" },
      include: { appointment: true },
    })
    return NextResponse.json(transactions)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: Request) {
  try {
    const raw = await req.json()
    const parsed = CreateTransactionSchema.safeParse(raw)
    if (!parsed.success) {
      throw new ValidationError("Dados inválidos", parsed.error.issues)
    }

    const body = parsed.data

    if (body.appointmentId == null) {
      const transaction = await db.transaction.create({
        data: {
          type: body.type,
          category: body.category,
          description: body.description,
          amount: body.amount,
          date: body.date,
          paymentMethod: body.paymentMethod ?? undefined,
          status: body.status,
        },
      })
      return NextResponse.json(transaction, { status: 201 })
    }

    const appointmentId = body.appointmentId

    const result = await db.$transaction(async (tx) => {
      const appt = await tx.appointment.findUnique({
        where: { id: appointmentId },
        include: { transaction: true },
      })

      if (!appt) {
        throw new ValidationError("Agendamento não encontrado.")
      }

      if (appt.status !== "RegistrarChegada") {
        throw new ValidationError(
          "Só é possível registrar pagamento vinculado quando o agendamento está em «Registrar chegada»."
        )
      }

      if (appt.transaction) {
        throw new ConflictError("Este agendamento já possui transação vinculada.")
      }

      if (body.type !== "Receita") {
        throw new ValidationError("O pagamento da consulta deve ser uma receita.")
      }

      if (!isConsultOrFollowUpCategory(body.category)) {
        throw new ValidationError("Para pagamento de consulta, a categoria deve ser Consulta ou Retorno.")
      }

      if (body.status !== "Confirmado") {
        throw new ValidationError("Para liberar o Appointment, o status da transação deve ser Confirmado.")
      }

      if (!body.paymentMethod?.trim()) {
        throw new ValidationError("Informe a forma de pagamento.")
      }

      const config = await tx.financialConfig.findFirst()
      if (!config) {
        throw new ValidationError("Configure valores de consulta/retorno em Financeiro antes de registrar o pagamento.")
      }

      const coherent = amountMatchesFeeTable(
        body.category,
        body.amount,
        config.consultationFee,
        config.followUpFee
      )
      if (!coherent.ok) {
        throw new ValidationError(coherent.message)
      }

      const transaction = await tx.transaction.create({
        data: {
          type: body.type,
          category: body.category,
          description: body.description,
          amount: body.amount,
          date: body.date,
          paymentMethod: body.paymentMethod,
          status: body.status,
          appointmentId,
        },
      })

      const updatedAppointment = await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: "Pago" },
        include: appointmentWithRelations,
      })

      return { transaction, appointment: updatedAppointment }
    })

    return NextResponse.json(
      {
        transaction: result.transaction,
        appointment: toAppointment(result.appointment),
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
    const transaction = await db.transaction.update({ where: { id }, data })
    return NextResponse.json(transaction)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json()
    await db.transaction.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
