"use client"

import { useMemo, useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Plus, Trash2, Pencil, UserCheck, UserX } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/ui/PageHeader"
import { ModalHeader } from "@/components/ui/ModalHeader"
import { ModalOverlay } from "@/components/ui/modal-overlay"
import { Input, FormSelect } from "@/components/ui/Input"
import { UserRole, type UserRoleType } from "@/types/auth"
import {
  useUsers,
  useUsersMutations,
  USER_ROLE_FILTER_OPTIONS,
  USER_ROLE_LABEL,
  USER_ROLE_COLORS,
  type UserRow,
} from "@/hooks/useUsers"
import { TableSuspense } from "@/components/ui/TableSuspense"
import { DataTable, Td } from "@/components/ui/table/DataTable"
import { FilterField, GlobalFilters } from "@/components/ui/table/GlobalFilters"
import { Collapse } from "@/components/ui/Collapse"
import { useTableFilters } from "@/hooks/useTableFilters"

type UserFormValues = {
  username: string
  email: string
  password: string
  newPassword: string
  role: UserRoleType
}

const USER_FILTER_CONFIG: FilterField[] = [
  { name: "username", type: "input", placeholder: "Nome..." },
  { name: "email", type: "input", placeholder: "E-mail..." },
  {
    name: "role",
    type: "select",
    options: [...USER_ROLE_FILTER_OPTIONS],
    placeholder: "Permissão...",
  },
]

type UserFilters = {
  username: string
  email: string
  role: string
}

function UsersTable({
  currentUserId,
  isSuperAdmin,
  filters,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  currentUserId?: string
  isSuperAdmin: boolean
  filters: UserFilters
  onEdit: (u: UserRow) => void
  onDelete: (id: string) => void
  onToggleActive: (u: UserRow) => void
}) {
  const { data: users } = useUsers()

  const filteredUsers = useMemo(
    () =>
      users.filter((u) => {
        const matchUsername = filters.username
          ? u.username.toLowerCase().includes(filters.username.toLowerCase())
          : true
        const matchEmail = filters.email
          ? u.email.toLowerCase().includes(filters.email.toLowerCase())
          : true
        const matchRole = filters.role ? u.role === filters.role : true
        return matchUsername && matchEmail && matchRole
      }),
    [users, filters]
  )

  return (
    <DataTable<UserRow>
      headers={[
        { label: "Nome", sort: (u) => u.username },
        { label: "Email", sort: (u) => u.email },
        { label: "Permissão", sort: (u) => USER_ROLE_LABEL[u.role] },
        { label: "Status", sort: (u) => (u.active ? "Ativo" : "Inativo") },
        { label: "Ações", align: "right" },
      ]}
      data={filteredUsers}
      emptyMessage="Nenhum usuário cadastrado"
      renderRow={(u) => (
        <tr key={u.id} className={`transition-colors hover:bg-gray-50/80 ${!u.active ? "opacity-40" : ""}`}>
          <Td className="font-medium">{u.username}</Td>
          <Td className="text-gray-600">{u.email}</Td>
          <Td>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${USER_ROLE_COLORS[u.role]}`}>
              {USER_ROLE_LABEL[u.role]}
            </span>
          </Td>
          <Td>
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${
                u.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
              }`}
            >
              {u.active ? "Ativo" : "Inativo"}
            </span>
          </Td>
          <Td>
            <div className="flex items-center justify-end gap-3">
              {isSuperAdmin && (
                <Button
                  variant="ghost"
                  onClick={() => onToggleActive(u)}
                  disabled={u.id === currentUserId}
                >
                  {u.active ? (
                    <>
                      <UserX size={14} /> Desativar
                    </>
                  ) : (
                    <>
                      <UserCheck size={14} /> Ativar
                    </>
                  )}
                </Button>
              )}
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
  const { session, canManageUsers, isSuperAdmin } = useAuth()
  const router = useRouter()
  const { createUser, updateUser, removeUser, toggleActive } = useUsersMutations()
  const { filters, handleFilterChange } = useTableFilters<UserFilters>({
    username: "",
    email: "",
    role: "",
  })
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<UserRow | null>(null)
  const { register, handleSubmit, reset, setValue } = useForm<UserFormValues>()

  useEffect(() => {
    if (session && !canManageUsers) router.push("/dashboard")
  }, [session, canManageUsers, router])

  async function handleSave(data: UserFormValues) {
    if (editing) {
      const payload: { id: string; role: UserRoleType; password?: string } = {
        id: editing.id,
        role: data.role,
      }
      if (data.newPassword.trim()) {
        payload.password = data.newPassword.trim()
      }

      const updated = await updateUser(payload)
      if (!updated) return

      toast.success(
        data.newPassword.trim() ? "Usuário e senha atualizados." : "Usuário atualizado."
      )
    } else {
      const created = await createUser({
        name: data.username,
        email: data.email,
        password: data.password,
        role: data.role,
      })
      if (!created) return
    }
    setShowModal(false)
    setEditing(null)
    reset()
  }

  async function handleDelete(id: string) {
    await removeUser(id)
  }

  async function handleToggleActive(user: UserRow) {
    await toggleActive(user)
  }

  function openEdit(user: UserRow) {
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

      <div className="mt-4 flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden sm:gap-4">
        <div className="flex shrink-0 flex-col justify-center gap-3 rounded-3xl border border-gray-200 bg-white p-4 sm:p-5">
          <Collapse label="Filtros" unboundedPanel>
            <GlobalFilters
              values={filters}
              onChange={(name, value) => handleFilterChange(name as keyof UserFilters, value)}
              filters={USER_FILTER_CONFIG}
            />
          </Collapse>
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <TableSuspense cols={5} rows={5}>
            <UsersTable
              currentUserId={session?.user?.id}
              isSuperAdmin={isSuperAdmin}
              filters={filters}
              onEdit={openEdit}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
            />
          </TableSuspense>
        </div>
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
                <option value={UserRole.SuperAdmin}>Super Admin</option>
                <option value={UserRole.Admin}>Admin (Recepcionista)</option>
                <option value={UserRole.Medico}>Médico</option>
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
