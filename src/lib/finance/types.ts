/** Valores persistidos no banco — não traduzir. */
export type TransactionType = "Receita" | "Despesa"

export type FinanceTransaction = {
  id: number
  type: TransactionType
  category: string
  description: string
  amount: number
  date: string
  paymentMethod?: string | null
  status: string
}
