"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

type WithId = { id: number | string }

export function useCRUD<T extends WithId>(endpoint: string) {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(endpoint)
      .then((r) => r.json())
      .then((data) => { setItems(data); setLoading(false) })
  }, [endpoint])

  async function create(data: Omit<T, "id">, successMsg = "Criado com sucesso!") {
    const res = await fetch(endpoint, {
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
    const res = await fetch(endpoint, {
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
    await fetch(endpoint, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    setItems((prev) => prev.filter((item) => item.id !== id))
    toast.success(successMsg)
  }

  return { items, setItems, loading, create, update, remove }
}
