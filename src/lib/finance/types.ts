/** Valores persistidos no banco — não traduzir. */
export const TransactionType = {
  Income: "Receita",
  Expense: "Despesa",
} as const

export type TransactionTypeValue =
  (typeof TransactionType)[keyof typeof TransactionType]

export const TransactionStatus = {
  Confirmed: "Confirmado",
  Pending: "Pendente",
  Cancelled: "Cancelado",
  Overdue: "Vencido",
} as const

export type TransactionStatusValue =
  (typeof TransactionStatus)[keyof typeof TransactionStatus]

export type FinanceTransaction = {
  id: number
  type: TransactionTypeValue
  category: string
  description: string
  amount: number
  date: string
  paymentMethod?: string | null
  status: TransactionStatusValue
}

export const TRANSACTION_TYPE_OPTIONS = [
  { value: TransactionType.Income, label: TransactionType.Income },
  { value: TransactionType.Expense, label: TransactionType.Expense },
] as const

export const TRANSACTION_STATUS_OPTIONS = [
  { value: TransactionStatus.Confirmed, label: TransactionStatus.Confirmed },
  { value: TransactionStatus.Pending, label: TransactionStatus.Pending },
] as const
