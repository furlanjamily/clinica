"use client"

import { useMemo, useState } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCRUD } from "@/hooks/useCRUD"
import { Patient } from "@/types"
import { Header } from "@/components/ui/PageHeader"
import { TableSkeleton } from "@/components/ui/TableSkeleton"
import { DataTable, TableCard, Td } from "@/components/ui/table/DataTable"
import { FilterField, GlobalFilters } from "@/components/ui/table/GlobalFilters"
import { Collapse } from "@/components/ui/Collapse"
import { useTableFilters } from "@/hooks/useTableFilters"
import { PatientFormModal } from "@/components/patient/PatientFormModal"

function PatientsTable({
  patients,
  onEdit,
  onRemove,
}: {
  patients: Patient[]
  onEdit: (p: Patient) => void
  onRemove: (id: number, successMsg?: string) => void
}) {
  return (
    <DataTable<Patient>
      headers={[
        { label: "ID", sort: (p) => p.id },
        { label: "Nome", sort: (p) => p.name },
        { label: "CPF", sort: (p) => p.cpf || null },
        { label: "Telefone", sort: (p) => p.phone || null },
        { label: "E-mail", sort: (p) => p.email || null },
        { label: "Convênio", sort: (p) => p.insurancePlan || null },
        { label: "Ações", align: "right" },
      ]}
      data={patients}
      emptyMessage="Nenhum paciente cadastrado"
      minWidthClassName="min-w-[31rem]"
      renderRow={(p) => (
        <tr key={p.id} className="transition-colors hover:bg-gray-50/80">
          <Td className="font-medium">{p.id}</Td>
          <Td className="font-medium">{p.name}</Td>
          <Td className="text-gray-600">{p.cpf ?? "—"}</Td>
          <Td className="text-gray-600">{p.phone ?? "—"}</Td>
          <Td className="text-gray-600">{p.email ?? "—"}</Td>
          <Td className="text-gray-600">{p.insurancePlan ?? "—"}</Td>
          <Td>
            <div className="flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={() => onEdit(p)}><Pencil size={14} /> Editar</Button>
              <Button variant="ghost-danger" onClick={() => onRemove(p.id, "Paciente removido.")}><Trash2 size={14} /> Remover</Button>
            </div>
          </Td>
        </tr>
      )}
    />
  )
}

const PATIENT_FILTER_CONFIG: FilterField[] = [
  { name: "id", type: "input", placeholder: "ID..." },
  { name: "name", type: "input", placeholder: "Nome..." },
  { name: "cpf", type: "input", placeholder: "CPF..." },
  { name: "phone", type: "input", placeholder: "Telefone..." },
  { name: "email", type: "input", placeholder: "E-mail..." },
  {
    name: "insurancePlan",
    type: "select",
    options: [{ value: "", label: "Todos os convênios" }],
    placeholder: "Convênio...",
  },
  {
    name: "gender",
    type: "select",
    options: [
      { value: "", label: "Todos os sexos" },
      { value: "Masculino", label: "Masculino" },
      { value: "Feminino", label: "Feminino" },
      { value: "Outro", label: "Outro" },
    ],
    placeholder: "Sexo...",
  },
]

export default function PatientsPage() {
  const { items: patients, remove, isPending } = useCRUD<Patient>("/api/patient")
  const { filters, handleFilterChange } = useTableFilters({
    id: "",
    name: "",
    cpf: "",
    phone: "",
    email: "",
    insurancePlan: "",
    gender: "",
  })
  const [modal, setModal] = useState<{ open: boolean; editing: Patient | null }>({ open: false, editing: null })

  function openCreate() {
    setModal({ open: true, editing: null })
  }

  function openEdit(p: Patient) {
    setModal({ open: true, editing: p })
  }

  function closeModal() {
    setModal({ open: false, editing: null })
  }

  const filterConfig = useMemo<FilterField[]>(() => {
    const plans = [...new Set(patients.map((p) => p.insurancePlan).filter(Boolean))] as string[]
    return PATIENT_FILTER_CONFIG.map((field) =>
      field.name === "insurancePlan"
        ? {
          ...field,
          options: [
            { value: "", label: "Todos os convênios" },
            ...plans.sort((a, b) => a.localeCompare(b, "pt-BR")).map((plan) => ({ value: plan, label: plan })),
          ],
        }
        : field
    )
  }, [patients])

  const filteredPatients = useMemo(
    () =>
      patients.filter((p) => {
        const matchId = filters.id
          ? p.id.toString() === filters.id
          : true
        const matchName = filters.name
          ? p.name.toLowerCase().includes(filters.name.toLowerCase())
          : true
        const matchCpf = filters.cpf
          ? p.cpf?.toLowerCase().includes(filters.cpf.toLowerCase())
          : true
        const matchPhone = filters.phone
          ? p.phone?.toLowerCase().includes(filters.phone.toLowerCase())
          : true
        const matchEmail = filters.email ? p.email?.toLowerCase().includes(filters.email.toLowerCase())
          : true
        const matchInsurance = filters.insurancePlan
          ? (p.insurancePlan ?? "") === filters.insurancePlan
          : true
        const matchGender = filters.gender ? (p.gender ?? "") === filters.gender : true
        return matchId && matchName && matchInsurance && matchGender && matchCpf && matchPhone && matchEmail
      }),
    [patients, filters]
  )

  return (
    <div className="flex h-full min-h-0 min-w-0 max-w-full flex-col">
      <Header title="Pacientes">
        <Button size="md" onClick={openCreate}>
          <Plus size={16} /> <span className="hidden sm:inline">Novo paciente</span>
        </Button>
      </Header>

      <div className="mt-3 flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden sm:mt-4 sm:gap-4">
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
                <TableSkeleton cols={5} rows={6} />
              </div>
            </TableCard>
          ) : (
            <PatientsTable patients={filteredPatients} onEdit={openEdit} onRemove={remove} />
          )}
        </div>
      </div>

      {modal.open && (
        <PatientFormModal
          patient={modal.editing ?? undefined}
          onClose={closeModal}
        />
      )}
    </div>
  )
}
