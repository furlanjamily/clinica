"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Plus, Trash2, Pencil } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { TableSkeleton } from "@/components/ui/TableSkeleton"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/ui/PageHeader"
import { ModalHeader } from "@/components/ui/ModalHeader"
import { Input, FormSelect } from "@/components/ui/Input"
import type { UserRoleType } from "@/types/auth"

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

export default function UsersPage() {
  const { session, isSuperAdmin } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<UserType[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const { register, handleSubmit, reset, setValue } = useForm<{ username: string; email: string; password: string; role: string }>()

  useEffect(() => {
    if (session && !isSuperAdmin) {
      router.push("/dashboard")
      return
    }
    fetch("/api/user").then((r) => r.json()).then((data) => {
      setUsers(data.users)
      setLoading(false)
    })
  }, [session, isSuperAdmin, router])

  async function handleSave(data: any) {
    if (editing) {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, role: data.role }),
      })
      const updated = await res.json()
      setUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u))
      toast.success("Permissão atualizada.")
    } else {
      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const body = await res.json()
        toast.error(body.message)
        return
      }
      const novo = await res.json()
      setUsers((prev) => [...prev, novo])
      toast.success("Usuário criado com sucesso!")
    }
    setShowModal(false)
    setEditing(null)
    reset()
  }

  async function handleDelete(id: string) {
    await fetch("/api/user", {
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

      <div className="flex-1 overflow-auto">
        {loading ? (
          <TableSkeleton cols={4} rows={5} />
        ) : users?.length === 0 ? (
          <div className="flex items-center justify-center h-full text-accent text-sm">Nenhum usuário cadastrado</div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full border-separate border-spacing-y-2 min-w-[600px]">
            <thead>
              <tr>
                {["Nome", "Email", "Permissão", "Ações"].map((h) => (
                  <th key={h} className="text-left text-xs px-3 text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => (
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
                      <Button variant="ghost" onClick={() => openEdit(u)}>
                        <Pencil size={14} /> Editar
                      </Button>
                      <Button
                        variant="ghost-danger"
                        onClick={() => handleDelete(u.id)}
                        disabled={u.id === session?.user?.id}
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
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
            <ModalHeader title={editing ? "Editar permissão" : "Novo usuário"} onClose={() => { setShowModal(false); setEditing(null); reset() }} />

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

              <div className="flex justify-end gap-3 mt-2">
                <Button type="button" variant="ghost" onClick={() => { setShowModal(false); setEditing(null); reset() }}>Cancelar</Button>
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

 