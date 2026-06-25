"use client"

import { useMemo, useState } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCRUD } from "@/hooks/useCRUD"
import { Doctor } from "@/types"
import { Header } from "@/components/ui/PageHeader"
import { TableSkeleton } from "@/components/ui/TableSkeleton"
import { DataTable, TableCard, Td } from "@/components/ui/table/DataTable"
import { FilterField, GlobalFilters } from "@/components/ui/table/GlobalFilters"
import { Collapse } from "@/components/ui/Collapse"
import { useTableFilters } from "@/hooks/useTableFilters"
import { DoctorFormModal } from "@/components/doctor/DoctorFormModal"

function DoctorsTable({
  doctors,
  onEdit,
  onRemove,
}: {
  doctors: Doctor[]
  onEdit: (d: Doctor) => void
  onRemove: (id: number, successMsg?: string) => void
}) {
  return (
    <DataTable<Doctor>
      headers={[
        { label: "ID", sort: (d) => d.id },
        { label: "Nome", sort: (d) => d.name },
        { label: "CRM", sort: (d) => d.crm || null },
        { label: "Especialidade", sort: (d) => d.specialty || null },
        { label: "Turno", sort: (d) => d.shift || null },
        { label: "E-mail", sort: (d) => d.email || null },
        { label: "Contato", sort: (d) => d.phone ?? d.email ?? null },
        { label: "Ações", align: "right" },
      ]}
      data={doctors}
      emptyMessage="Nenhum médico cadastrado"
      renderRow={(d) => (
        <tr key={d.id} className={`transition-colors hover:bg-gray-50/80 ${!d.active ? "opacity-40" : ""}`}>
          <Td className="font-medium">{d.id}</Td>
          <Td className="font-medium">{d.name}</Td>
          <Td className="text-gray-600">{d.crm}</Td>
          <Td className="text-gray-600">{d.specialty}</Td>
          <Td className="text-gray-600">{d.shift ?? "—"}</Td>
          <Td className="text-gray-600">{d.email ?? "—"}</Td>
          <Td className="text-gray-600">{d.phone ?? "—"}</Td>
          <Td>
            <div className="flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={() => onEdit(d)}><Pencil size={14} /> Editar</Button>
              <Button variant="ghost-danger" onClick={() => onRemove(d.id, "Médico removido.")}><Trash2 size={14} /> Remover</Button>
            </div>
          </Td>
        </tr>
      )}
    />
  )
}

const DOCTOR_FILTER_CONFIG: FilterField[] = [
  { name: "id", type: "input", placeholder: "ID..." },
  { name: "name", type: "input", placeholder: "Nome..." },
  { name: "crm", type: "input", placeholder: "CRM..." },
  {
    name: "specialty",
    type: "select",
    options: [{ value: "", label: "Todas as especialidades" }],
    placeholder: "Especialidade...",
  },
  {
    name: "shift",
    type: "select",
    options: [
      { value: "", label: "Todos os turnos" },
      { value: "Manhã", label: "Manhã" },
      { value: "Tarde", label: "Tarde" },
      { value: "Integral", label: "Integral" },
    ],
    placeholder: "Turno...",
  },
  { name: "email", type: "input", placeholder: "E-mail..." },
  { name: "phone", type: "input", placeholder: "Telefone..." },
]

export default function DoctorsPage() {
  const { items: doctors, remove, isPending } = useCRUD<Doctor>("/api/doctor")
  const { filters, handleFilterChange } = useTableFilters({
    id: "",
    name: "",
    crm: "",
    phone: "",
    email: "",
    specialty: "",
    shift: "",
  })
  const [modal, setModal] = useState<{ open: boolean; editing: Doctor | null }>({ open: false, editing: null })

  function openCreate() {
    setModal({ open: true, editing: null })
  }

  function openEdit(d: Doctor) {
    setModal({ open: true, editing: d })
  }

  function closeModal() {
    setModal({ open: false, editing: null })
  }

  const filterConfig = useMemo<FilterField[]>(() => {
    const specialties = [...new Set(doctors.map((d) => d.specialty).filter(Boolean))] as string[]
    return DOCTOR_FILTER_CONFIG.map((field) =>
      field.name === "specialty"
        ? {
            ...field,
            options: [
              { value: "", label: "Todas as especialidades" },
              ...specialties
                .sort((a, b) => a.localeCompare(b, "pt-BR"))
                .map((specialty) => ({ value: specialty, label: specialty })),
            ],
          }
        : field
    )
  }, [doctors])

  const filteredDoctors = useMemo(
    () =>
      doctors.filter((d) => {
        const matchId = filters.id ? d.id.toString() === filters.id : true
        const matchCrm = filters.crm ? d.crm.includes(filters.crm.toUpperCase()): true
        const matchPhone = filters.phone ? d.phone?.includes(filters.phone) : true
        const matchEmail = filters.email ? d.email?.includes(filters.email.toLowerCase()): true
        const matchName = filters.name
          ? d.name.toLowerCase().includes(filters.name.toLowerCase())
          : true
        const matchSpecialty = filters.specialty ? d.specialty === filters.specialty : true
        const matchShift = filters.shift ? (d.shift ?? "") === filters.shift : true
        return matchId && matchName && matchSpecialty && matchShift && matchCrm && matchPhone && matchEmail
      }),
    [doctors, filters]
  )

  return (
    <div className="flex h-full min-h-0 min-w-0 max-w-full flex-col">
      <Header title="Médicos">
        <Button size="md" onClick={openCreate}>
          <Plus size={16} /> Novo médico
        </Button>
      </Header>

      <div className="mt-4 flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden sm:gap-4">
        <div className="flex shrink-0 flex-col justify-center gap-3 rounded-3xl border border-gray-200 bg-white p-4 sm:p-5">
          <Collapse label="Filtros" unboundedPanel>
            <GlobalFilters
              values={filters}
              onChange={(name, value) => handleFilterChange(name as keyof typeof filters, value)}
              filters={filterConfig}
            />
          </Collapse>
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {isPending ? (
            <TableCard>
              <div className="p-2 sm:p-3">
                <TableSkeleton cols={6} rows={6} />
              </div>
            </TableCard>
          ) : (
            <DoctorsTable doctors={filteredDoctors} onEdit={openEdit} onRemove={remove} />
          )}
        </div>
      </div>

      {modal.open && (
        <DoctorFormModal
          doctor={modal.editing ?? undefined}
          onClose={closeModal}
        />
      )}
    </div>
  )
}
