"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Plus, Trash2, Pencil } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/ui/PageHeader"
import { ModalHeader } from "@/components/ui/ModalHeader"
import { Input, FormSelect } from "@/components/ui/Input"
import type { UserRoleType } from "@/types/auth"
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query"
import { TableSuspense } from "@/components/ui/TableSuspense"
import { absoluteUrl } from "@/lib/absolute-url"

const roleLabel: Record<UserRoleType, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  MEDICO: "Médico",
}

const roleColors: Record<UserRoleType, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-700",
  ADMIN: "bg-blue-100 text-blue-700",
  MEDICO: "bg-green-100 text-green-700",
}

export type UserType = { id: string; username: string; email: string; role: UserRoleType }

const QUERY_KEY = ["users"] as const

function UsersTable({
  currentUserId,
  onEdit,
  onDelete,
}: {
  currentUserId?: string
  onEdit: (u: UserType) => void
  onDelete: (id: string) => void
}) {
  const { data: users } = useSuspenseQuery<UserType[]>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await fetch(absoluteUrl("/api/user"))
      const payload: unknown = await res.json()
      const raw = Array.isArray(payload) ? payload : (payload as { users?: unknown })?.users
      if (!Array.isArray(raw)) return []
      return raw.map((u) => {
        const row = u as { id: string; name?: string; username?: string; email: string; role: UserRoleType }
        return {
          id: row.id,
          username: row.username ?? row.name ?? "",
          email: row.email,
          role: row.role,
        }
      })
    },
  })

  if (users.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-accent text-sm">
        Nenhum usuário cadastrado
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-y-2 min-w-[600px]">
        <thead>
          <tr>
            {["Nome", "Email", "Permissão", "Ações"].map((h) => (
              <th key={h} className="text-left text-xs px-3 text-gray-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="bg-white shadow-sm">
              <td className="p-3 text-sm">{u.username}</td>
              <td className="p-3 text-sm text-gray-600">{u.email}</td>
              <td className="p-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${roleColors[u.role]}`}>
                  {roleLabel[u.role]}
                </span>
              </td>
              <td className="p-3">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" onClick={() => onEdit(u)}>
                    <Pencil size={14} /> Editar
                  </Button>
                  <Button
                    variant="ghost-danger"
                    onClick={() => onDelete(u.id)}
                    disabled={u.id === currentUserId}
                  >
                    <Trash2 size={14} /> Remover
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function UsersPage() {
  const { session, isSuperAdmin } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<UserType | null>(null)
  const { register, handleSubmit, reset, setValue } = useForm<{ username: string; email: string; password: string; role: string }>()

  useEffect(() => {
    if (session && !isSuperAdmin) router.push("/dashboard")
  }, [session, isSuperAdmin, router])

  function setUsers(updater: (prev: UserType[]) => UserType[]) {
    queryClient.setQueryData<UserType[]>(QUERY_KEY, (prev) => updater(prev ?? []))
  }

  async function handleSave(data: any) {
    if (editing) {
      const res = await fetch(absoluteUrl("/api/user"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, role: data.role }),
      })
      const updated = await res.json()
      setUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u))
      toast.success("Permissão atualizada.")
    } else {
      const res = await fetch(absoluteUrl("/api/user"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) { toast.error((await res.json()).message); return }
      const novo = await res.json()
      setUsers((prev) => [...prev, novo])
      toast.success("Usuário criado com sucesso!")
    }
    setShowModal(false)
    setEditing(null)
    reset()
  }

  async function handleDelete(id: string) {
    await fetch(absoluteUrl("/api/user"), {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    setUsers((prev) => prev.filter((u) => u.id !== id))
    toast.success("Usuário removido.")
  }

  function openEdit(user: UserType) {
    setEditing(user)
    setValue("role", user.role)
    setShowModal(true)
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <Header title="Usuários">
        <Button size="md" onClick={() => { setEditing(null); reset(); setShowModal(true) }}>
          <Plus size={16} /> Novo usuário
        </Button>
      </Header>

      <div className="flex-1 overflow-auto mt-4">
        <TableSuspense cols={4} rows={5}>
          <UsersTable
            currentUserId={session?.user?.id}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        </TableSuspense>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="max-h-[min(92vh,36rem)] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-4 shadow-lg sm:rounded-xl sm:p-6">
            <ModalHeader
              title={editing ? "Editar permissão" : "Novo usuário"}
              onClose={() => { setShowModal(false); setEditing(null); reset() }}
            />
            <form onSubmit={handleSubmit(handleSave)} className="flex flex-col gap-4">
              {!editing && (
                <>
                  <Input label="Nome" {...register("username", { required: true })} placeholder="Nome completo" />
                  <Input label="Email" type="email" {...register("email", { required: true })} placeholder="email@clinica.com" />
                  <Input label="Senha" type="password" {...register("password", { required: true })} placeholder="Mínimo 8 caracteres" />
                </>
              )}
              <FormSelect label="Permissão" {...register("role")}>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN">Admin (Recepcionista)</option>
                <option value="MEDICO">Médico</option>
              </FormSelect>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
                <Button type="button" variant="ghost" onClick={() => { setShowModal(false); setEditing(null); reset() }}>
                  Cancelar
                </Button>
                <Button type="submit" size="md">
                  {editing ? "Salvar" : "Criar usuário"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
