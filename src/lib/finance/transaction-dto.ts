import type { Transaction as PrismaTransaction, Prisma } from "@/generated/prisma/client"
import { dateOnlyToString, localDateOnly } from "@/lib/datetime/appointment-time"
import type { FinanceTransaction } from "./types"

type TransactionWriteInput = {
  type?: "Receita" | "Despesa"
  category?: string
  description?: string
  amount?: number
  date?: string
  paymentMethod?: string | null
  status?: "Confirmado" | "Pendente" | "Cancelado" | "Vencido"
}

/** Contrato da UI -> banco (date -> competenceDate, amount -> Decimal). */
export function transactionWriteToDb(
  input: TransactionWriteInput
): Prisma.TransactionUncheckedUpdateInput {
  const { date, ...rest } = input
  return {
    ...rest,
    ...(date !== undefined ? { competenceDate: localDateOnly(date) } : {}),
  }
}

/** Banco -> contrato da UI (Decimal -> number, competenceDate -> "YYYY-MM-DD"). */
export function toTransactionDTO(t: PrismaTransaction): FinanceTransaction & {
  appointmentId: number | null
} {
  return {
    id: t.id,
    type: t.type,
    category: t.category,
    description: t.description,
    amount: Number(t.amount),
    date: dateOnlyToString(t.competenceDate) ?? "",
    paymentMethod: t.paymentMethod,
    status: t.status,
    appointmentId: t.appointmentId,
  }
}
