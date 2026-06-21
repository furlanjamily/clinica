"use client"

import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { absoluteUrl } from "@/lib/absolute-url"
import type { FinanceTransaction } from "@/lib/finance/types"
import type { FinancialConfigValues } from "@/lib/finance/config"

export const FINANCE_CONFIG_QUERY_KEY = ["finance", "config"] as const

export function transactionsQueryKey(month: string, typeFilter: string) {
  return ["finance", "transactions", { month, typeFilter }] as const
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json()
    return body?.message ?? fallback
  } catch {
    return fallback
  }
}

/** Transações do mês (e tipo, opcional). Mantém dados anteriores ao trocar filtros. */
export function useFinanceTransactions(month: string, typeFilter: string) {
  return useQuery<FinanceTransaction[]>({
    queryKey: transactionsQueryKey(month, typeFilter),
    queryFn: async () => {
      const params = new URLSearchParams({ mes: month })
      if (typeFilter) params.set("tipo", typeFilter)

      const res = await fetch(absoluteUrl(`/api/finance/transactions?${params}`))
      if (!res.ok) throw new Error("Erro ao buscar transações")

      const data = await res.json()
      return Array.isArray(data) ? data : []
    },
    placeholderData: keepPreviousData,
  })
}

export function useFinancialConfig() {
  return useQuery<FinancialConfigValues>({
    queryKey: FINANCE_CONFIG_QUERY_KEY,
    queryFn: async () => {
      const res = await fetch(absoluteUrl("/api/finance/config"))
      if (!res.ok) throw new Error("Erro ao buscar configuração financeira")
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })
}

/** Mutações de finanças com atualização do cache do React Query e feedback via toast. */
export function useFinanceMutations(month: string, typeFilter: string) {
  const queryClient = useQueryClient()
  const listKey = transactionsQueryKey(month, typeFilter)

  function setTransactions(updater: (prev: FinanceTransaction[]) => FinanceTransaction[]) {
    queryClient.setQueryData<FinanceTransaction[]>(listKey, (prev) => updater(prev ?? []))
  }

  async function createTransaction(data: Omit<FinanceTransaction, "id">) {
    const res = await fetch(absoluteUrl("/api/finance/transactions"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      toast.error(await readErrorMessage(res, "Não foi possível registrar."))
      return null
    }

    const body = await res.json()
    // POST vinculado a agendamento devolve { transaction, appointment }
    const created: FinanceTransaction = body.transaction ?? body
    setTransactions((prev) => [created, ...prev])
    toast.success("Transação registrada!")
    return created
  }

  async function removeTransaction(id: number) {
    const res = await fetch(absoluteUrl("/api/finance/transactions"), {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })

    if (!res.ok) {
      toast.error(await readErrorMessage(res, "Erro ao remover transação."))
      return false
    }

    setTransactions((prev) => prev.filter((t) => t.id !== id))
    toast.success("Transação removida.")
    return true
  }

  async function saveConfig(data: FinancialConfigValues) {
    const res = await fetch(absoluteUrl("/api/finance/config"), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      toast.error(await readErrorMessage(res, "Erro ao salvar configurações."))
      return null
    }

    const updated: FinancialConfigValues = await res.json()
    queryClient.setQueryData(FINANCE_CONFIG_QUERY_KEY, updated)
    toast.success("Configurações salvas!")
    return updated
  }

  return { createTransaction, removeTransaction, saveConfig }
}
