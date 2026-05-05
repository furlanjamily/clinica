"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useSuspenseQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { absoluteUrl } from "@/lib/absolute-url"

type WithId = { id: number | string }

function makeQueryKey(endpoint: string) {
  return ["crud", endpoint] as const
}

export function useCRUD<T extends WithId>(endpoint: string) {
  const queryClient = useQueryClient()

  const { data: items } = useSuspenseQuery<T[]>({
    queryKey: makeQueryKey(endpoint),
    queryFn: async () => {
      try {
        const res = await fetch(absoluteUrl(endpoint))
        const payload: unknown = await res.json()
        return Array.isArray(payload) ? (payload as T[]) : []
      } catch {
        return []
      }
    },
  })

  function setItems(updater: (prev: T[]) => T[]) {
    queryClient.setQueryData<T[]>(makeQueryKey(endpoint), (prev) =>
      updater(prev ?? [])
    )
  }

  async function create(data: Omit<T, "id">, successMsg = "Criado com sucesso!") {
    const res = await fetch(absoluteUrl(endpoint), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.json()
      toast.error(body.message ?? "Erro ao criar.")
      return null
    }
    const created: T = await res.json()
    setItems((prev) => [...prev, created])
    toast.success(successMsg)
    return created
  }

  async function update(id: T["id"], data: Partial<T>, successMsg = "Atualizado com sucesso!") {
    const res = await fetch(absoluteUrl(endpoint), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    })
    const updated: T = await res.json()
    setItems((prev) => prev.map((item) => item.id === id ? updated : item))
    toast.success(successMsg)
    return updated
  }

  async function remove(id: T["id"], successMsg = "Removido com sucesso!") {
    await fetch(absoluteUrl(endpoint), {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    setItems((prev) => prev.filter((item) => item.id !== id))
    toast.success(successMsg)
  }

  return { items, create, update, remove }
}
