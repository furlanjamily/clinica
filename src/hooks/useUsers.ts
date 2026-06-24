"use client"

import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { absoluteUrl } from "@/lib/absolute-url"
import { UserRole, type UserRoleType } from "@/types/auth"

export const USERS_QUERY_KEY = ["users"] as const

export type UserRow = {
  id: string
  username: string
  email: string
  role: UserRoleType
  active: boolean
  doctorName?: string | null
}

type ApiUser = {
  id: string
  name?: string
  username?: string
  email: string
  role: UserRoleType
  active?: boolean
  doctorName?: string | null
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json()
    return body?.message ?? fallback
  } catch {
    return fallback
  }
}

function mapUserFromApi(row: ApiUser): UserRow {
  return {
    id: row.id,
    username: row.username ?? row.name ?? "",
    email: row.email,
    role: row.role,
    active: row.active ?? true,
    doctorName: row.doctorName ?? null,
  }
}

export async function fetchUsers(): Promise<UserRow[]> {
  const res = await fetch(absoluteUrl("/api/user"))
  if (!res.ok) throw new Error("Erro ao buscar usuários")
  const payload: unknown = await res.json()
  const raw = Array.isArray(payload) ? payload : (payload as { users?: unknown })?.users
  if (!Array.isArray(raw)) return []
  return raw.map((u) => mapUserFromApi(u as ApiUser))
}

export function useUsers() {
  return useSuspenseQuery<UserRow[]>({
    queryKey: USERS_QUERY_KEY,
    queryFn: fetchUsers,
  })
}

export function useUsersMutations() {
  const queryClient = useQueryClient()

  function setUsers(updater: (prev: UserRow[]) => UserRow[]) {
    queryClient.setQueryData<UserRow[]>(USERS_QUERY_KEY, (prev) => updater(prev ?? []))
  }

  async function createUser(data: {
    name: string
    email: string
    password: string
    role: UserRoleType
  }): Promise<UserRow | null> {
    const res = await fetch(absoluteUrl("/api/user"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      toast.error(await readErrorMessage(res, "Erro ao criar usuário."))
      return null
    }
    const created: ApiUser = await res.json()
    const row = mapUserFromApi(created)
    setUsers((prev) => [...prev, row])
    toast.success("Usuário criado com sucesso!")
    return row
  }

  async function updateUser(payload: {
    id: string
    role?: UserRoleType
    password?: string
    active?: boolean
  }): Promise<UserRow | null> {
    const res = await fetch(absoluteUrl("/api/user"), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      toast.error(await readErrorMessage(res, "Erro ao atualizar usuário."))
      return null
    }
    const updated: ApiUser = await res.json()
    const row = mapUserFromApi(updated)
    setUsers((prev) => prev.map((u) => (u.id === row.id ? row : u)))
    return row
  }

  async function removeUser(id: string): Promise<boolean> {
    const res = await fetch(absoluteUrl("/api/user"), {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) {
      toast.error("Erro ao remover usuário.")
      return false
    }
    setUsers((prev) => prev.filter((u) => u.id !== id))
    toast.success("Usuário removido.")
    return true
  }

  async function toggleActive(user: UserRow): Promise<UserRow | null> {
    const updated = await updateUser({ id: user.id, active: !user.active })
    if (updated) {
      toast.success(updated.active ? "Usuário ativado." : "Usuário desativado.")
    }
    return updated
  }

  return { createUser, updateUser, removeUser, toggleActive }
}

export const USER_ROLE_FILTER_OPTIONS = [
  { value: "", label: "Todas as permissões" },
  { value: UserRole.SuperAdmin, label: "Super Admin" },
  { value: UserRole.Admin, label: "Admin" },
  { value: UserRole.Medico, label: "Médico" },
] as const

export const USER_ROLE_LABEL: Record<UserRoleType, string> = {
  [UserRole.SuperAdmin]: "Super Admin",
  [UserRole.Admin]: "Admin",
  [UserRole.Medico]: "Médico",
}

export const USER_ROLE_COLORS: Record<UserRoleType, string> = {
  [UserRole.SuperAdmin]: "bg-purple-100 text-purple-700",
  [UserRole.Admin]: "bg-blue-100 text-blue-700",
  [UserRole.Medico]: "bg-green-100 text-green-700",
}
