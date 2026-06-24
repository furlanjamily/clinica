import {
  DESPESA_CATEGORIAS,
  RECEITA_CATEGORIAS,
  TRANSACTION_PAYMENT_METHODS,
} from "@/lib/finance/categories"
import {
  TransactionStatus,
  TransactionType,
  type FinanceTransaction,
} from "@/lib/finance/types"
import type { FilterField } from "@/components/ui/table/GlobalFilters"

export type TransactionTableFilters = {
  date: string
  type: string
  category: string
  paymentMethod: string
  status: string
}

export const EMPTY_TRANSACTION_FILTERS: TransactionTableFilters = {
  date: "",
  type: "",
  category: "",
  paymentMethod: "",
  status: "",
}

const ALL_CATEGORIES = [...new Set([...RECEITA_CATEGORIAS, ...DESPESA_CATEGORIAS])]

export const TRANSACTION_FILTER_FIELDS: FilterField[] = [
  { name: "date", type: "date" },
  {
    name: "type",
    type: "select",
    options: [
      { value: "", label: "Todos os tipos" },
      { value: TransactionType.Income, label: "Receitas" },
      { value: TransactionType.Expense, label: "Despesas" },
    ],
    placeholder: "Tipo...",
  },
  {
    name: "category",
    type: "select",
    options: [
      { value: "", label: "Todas as categorias" },
      ...ALL_CATEGORIES.map((category) => ({ value: category, label: category })),
    ],
    placeholder: "Categoria...",
  },
  {
    name: "paymentMethod",
    type: "select",
    options: [
      { value: "", label: "Todas as formas de pagamento" },
      ...TRANSACTION_PAYMENT_METHODS.map((method) => ({ value: method, label: method })),
    ],
    placeholder: "Forma de pagamento...",
  },
  {
    name: "status",
    type: "select",
    options: [
      { value: "", label: "Todos os status" },
      { value: TransactionStatus.Confirmed, label: "Confirmado" },
      { value: TransactionStatus.Pending, label: "Pendente" },
    ],
    placeholder: "Status...",
  },
]

export function filterTransactions(
  transactions: FinanceTransaction[],
  filters: TransactionTableFilters
): FinanceTransaction[] {
  return transactions.filter((transaction) => {
    if (filters.date && transaction.date !== filters.date) return false
    if (filters.type && transaction.type !== filters.type) return false
    if (filters.category && transaction.category !== filters.category) return false
    if (filters.paymentMethod && transaction.paymentMethod !== filters.paymentMethod) return false
    if (filters.status && transaction.status !== filters.status) return false
    return true
  })
}
