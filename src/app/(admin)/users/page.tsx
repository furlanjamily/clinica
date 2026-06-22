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
import { ModalOverlay } from "@/components/ui/modal-overlay"
import { Input, FormSelect } from "@/components/ui/Input"
import type { UserRoleType } from "@/types/auth"
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query"
import { TableSuspense } from "@/components/ui/TableSuspense"
import { DataTable, Td } from "@/components/ui/table/DataTable"
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

export type UserType = {
  id: string
  username: string
  email: string
  role: UserRoleType
  doctorName?: string | null
}

type UserFormValues = {
  username: string
  email: string
  password: string
  newPassword: string
  role: UserRoleType
}

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
        const row = u as {
          id: string
          name?: string
          username?: string
          email: string
          role: UserRoleType
          doctorName?: string | null
        }
        return {
          id: row.id,
          username: row.username ?? row.name ?? "",
          email: row.email,
          role: row.role,
          doctorName: row.doctorName ?? null,
        }
      })
    },
  })

  return (
    <DataTable<UserType>
      headers={[
        { label: "Nome", sort: (u) => u.username },
        { label: "Email", sort: (u) => u.email },
        { label: "Médico vinculado", sort: (u) => u.doctorName ?? "" },
        { label: "Permissão", sort: (u) => roleLabel[u.role] },
        { label: "Ações", align: "right" },
      ]}
      data={users}
      emptyMessage="Nenhum usuário cadastrado"
      renderRow={(u) => (
        <tr key={u.id} className="transition-colors hover:bg-gray-50/80">
          <Td className="font-medium">{u.username}</Td>
          <Td className="text-gray-600">{u.email}</Td>
          <Td className="text-gray-600">{u.doctorName ?? "—"}</Td>
          <Td>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${roleColors[u.role]}`}>
              {roleLabel[u.role]}
            </span>
          </Td>
          <Td>
            <div className="flex items-center justify-end gap-3">
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
          </Td>
        </tr>
      )}
    />
  )
}

export default function UsersPage() {
  const { session, canManageUsers } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<UserType | null>(null)
  const { register, handleSubmit, reset, setValue } = useForm<UserFormValues>()

  useEffect(() => {
    if (session && !canManageUsers) router.push("/dashboard")
  }, [session, canManageUsers, router])

  function setUsers(updater: (prev: UserType[]) => UserType[]) {
    queryClient.setQueryData<UserType[]>(QUERY_KEY, (prev) => updater(prev ?? []))
  }

  async function handleSave(data: UserFormValues) {
    if (editing) {
      const payload: { id: string; role: UserRoleType; password?: string } = {
        id: editing.id,
        role: data.role,
      }
      if (data.newPassword.trim()) {
        payload.password = data.newPassword.trim()
      }

      const res = await fetch(absoluteUrl("/api/user"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        toast.error((await res.json()).message ?? "Erro ao atualizar usuário.")
        return
      }
      const updated: {
        id: string
        name?: string
        email: string
        role: UserRoleType
        doctorName?: string | null
      } = await res.json()
      setUsers((prev) =>
        prev.map((u) =>
          u.id === updated.id
            ? {
                id: updated.id,
                username: updated.name ?? u.username,
                email: updated.email,
                role: updated.role,
                doctorName: updated.doctorName ?? u.doctorName,
              }
            : u
        )
      )
      toast.success(
        data.newPassword.trim() ? "Usuário e senha atualizados." : "Usuário atualizado."
      )
    } else {
      const res = await fetch(absoluteUrl("/api/user"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.username,
          email: data.email,
          password: data.password,
          role: data.role,
        }),
      })
      if (!res.ok) {
        toast.error((await res.json()).message ?? "Erro ao criar usuário.")
        return
      }
      const created: { id: string; name?: string; email: string; role: UserRoleType } = await res.json()
      setUsers((prev) => [
        ...prev,
        { id: created.id, username: created.name ?? "", email: created.email, role: created.role },
      ])
      toast.success("Usuário criado com sucesso!")
    }
    setShowModal(false)
    setEditing(null)
    reset()
  }

  async function handleDelete(id: string) {
    const res = await fetch(absoluteUrl("/api/user"), {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) {
      toast.error("Erro ao remover usuário.")
      return
    }
    setUsers((prev) => prev.filter((u) => u.id !== id))
    toast.success("Usuário removido.")
  }

  function openEdit(user: UserType) {
    setEditing(user)
    setValue("role", user.role)
    setValue("newPassword", "")
    setShowModal(true)
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 max-w-full flex-col">
      <Header title="Usuários">
        <Button size="md" onClick={() => { setEditing(null); reset(); setShowModal(true) }}>
          <Plus size={16} /> Novo usuário
        </Button>
      </Header>

      <div className="mt-4 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <TableSuspense cols={5} rows={5}>
          <UsersTable
            currentUserId={session?.user?.id}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        </TableSuspense>
      </div>

      {showModal && (
        <ModalOverlay>
          <div className="max-h-[min(92vh,36rem)] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-4 shadow-lg sm:rounded-xl sm:p-6">
            <ModalHeader
              title={editing ? "Editar usuário" : "Novo usuário"}
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
              {editing && (
                <>
                  <Input label="Nome" value={editing.username} disabled />
                  <Input label="Email" value={editing.email} disabled />
                  {editing.doctorName && (
                    <Input label="Médico vinculado" value={editing.doctorName} disabled />
                  )}
                  <Input
                    label="Nova senha"
                    type="password"
                    autoComplete="new-password"
                    {...register("newPassword")}
                    placeholder="Deixe em branco para manter a atual"
                  />
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
        </ModalOverlay>
      )}
    </div>
  )
}
