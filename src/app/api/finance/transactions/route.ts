import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { toAppointment } from "@/lib/schedule/map-appointment"
import {
  CreateTransactionSchema,
  isConsultOrFollowUpCategory,
  amountMatchesFeeTable,
} from "@/lib/validations/finance-transaction"
import { handleApiError } from "@/lib/errors/error-handler"
import { ValidationError, ConflictError, NotFoundError } from "@/lib/errors/custom-errors"
import { requireSession } from "@/lib/auth/api-guard"
import { parseWith } from "@/lib/validations/parse"
import { AppointmentStatus } from "@/lib/schedule/status"
import { TransactionStatus, TransactionType } from "@/lib/finance/types"
import { toTransactionDTO, transactionWriteToDb } from "@/lib/finance/transaction-dto"
import { localDateOnly, startOfLocalDay } from "@/lib/datetime/appointment-time"
import type { Prisma } from "@/generated/prisma/client"

const UpdateTransactionSchema = CreateTransactionSchema.omit({ appointmentId: true })
  .partial()
  .extend({ id: z.number().int().positive() })

const DeleteTransactionSchema = z.object({ id: z.number().int().positive() })

const nestedAppointmentSelect = {
  id: true,
  scheduledStart: true,
  professionalNameSnapshot: true,
  patientNameSnapshot: true,
  patientId: true,
} as const

const appointmentWithRelations = {
  patient: true,
  doctor: true,
  medicalRecord: {
    include: {
      patient: true,
      appointment: { select: nestedAppointmentSelect },
    },
  },
  transaction: true,
} as const

export async function GET(req: Request) {
  try {
    await requireSession()
    const { searchParams } = new URL(req.url)
    const month = searchParams.get("mes")
    const type = searchParams.get("tipo")

    const where: Prisma.TransactionWhereInput = { deletedAt: null }
    if (month) {
      const [y, m] = month.split("-").map(Number)
      const nextMonth = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`
      where.competenceDate = {
        gte: startOfLocalDay(`${month}-01`),
        lt: startOfLocalDay(`${nextMonth}-01`),
      }
    }
    if (type === TransactionType.Income || type === TransactionType.Expense) where.type = type

    const transactions = await db.transaction.findMany({
      where,
      orderBy: { competenceDate: "desc" },
    })
    return NextResponse.json(transactions.map(toTransactionDTO))
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: Request) {
  try {
    await requireSession()
    const body = parseWith(CreateTransactionSchema, await req.json())

    if (body.appointmentId == null) {
      const transaction = await db.transaction.create({
        data: {
          type: body.type,
          category: body.category,
          description: body.description,
          amount: body.amount,
          competenceDate: localDateOnly(body.date),
          paymentMethod: body.paymentMethod ?? undefined,
          status: body.status,
          paidAt: body.status === TransactionStatus.Confirmed ? new Date() : undefined,
        },
      })
      return NextResponse.json(toTransactionDTO(transaction), { status: 201 })
    }

    const appointmentId = body.appointmentId

    const result = await db.$transaction(async (tx) => {
      const appt = await tx.appointment.findUnique({
        where: { id: appointmentId },
        include: { transaction: true },
      })

      if (!appt) {
        throw new NotFoundError("Agendamento não encontrado.")
      }

      if (appt.status !== AppointmentStatus.CheckIn) {
        throw new ValidationError(
          "Só é possível registrar pagamento vinculado quando o agendamento está em «Registrar chegada»."
        )
      }

      if (appt.transaction) {
        throw new ConflictError("Este agendamento já possui transação vinculada.")
      }

      if (body.type !== TransactionType.Income) {
        throw new ValidationError("O pagamento da consulta deve ser uma receita.")
      }

      if (!isConsultOrFollowUpCategory(body.category)) {
        throw new ValidationError("Para pagamento de consulta, a categoria deve ser Consulta ou Retorno.")
      }

      if (body.status !== TransactionStatus.Confirmed) {
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
        Number(config.consultationFee),
        Number(config.followUpFee)
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
          competenceDate: localDateOnly(body.date),
          paymentMethod: body.paymentMethod,
          status: body.status,
          paidAt: new Date(),
          appointmentId,
        },
      })

      const updatedAppointment = await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: AppointmentStatus.Paid },
        include: appointmentWithRelations,
      })

      return { transaction, appointment: updatedAppointment }
    })

    return NextResponse.json(
      {
        transaction: toTransactionDTO(result.transaction),
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
    await requireSession()
    const { id, ...data } = parseWith(UpdateTransactionSchema, await req.json())
    const transaction = await db.transaction.update({
      where: { id },
      data: transactionWriteToDb(data),
    })
    return NextResponse.json(toTransactionDTO(transaction))
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(req: Request) {
  try {
    await requireSession()
    const { id } = parseWith(DeleteTransactionSchema, await req.json())
    await db.transaction.update({ where: { id }, data: { deletedAt: new Date() } })
    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
