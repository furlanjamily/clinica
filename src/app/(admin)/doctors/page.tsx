"use client"

import { useMemo, useState, type ChangeEvent } from "react"
import { useForm, Controller } from "react-hook-form"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCRUD } from "@/hooks/useCRUD"
import { Doctor } from "@/types"
import { Header } from "@/components/ui/PageHeader"
import { ModalHeader } from "@/components/ui/ModalHeader"
import { ModalOverlay } from "@/components/ui/modal-overlay"
import { Input, Textarea, FormSelect } from "@/components/ui/Input"
import { TableSkeleton } from "@/components/ui/TableSkeleton"
import { DataTable, TableCard, Td } from "@/components/ui/table/DataTable"
import { FilterField, GlobalFilters } from "@/components/ui/table/GlobalFilters"
import { Collapse } from "@/components/ui/Collapse"
import { useTableFilters } from "@/hooks/useTableFilters"
import { CepEnderecoBlock } from "@/components/forms/CepEnderecoBlock"

/** Título neutro obrigatório no cadastro de novo médico (Dr./Dra.). */
const DOCTOR_NAME_PREFIX = "Dr(a). "

function normalizeDoctorNameOnCreateInput(value: string): string {
  if (value.startsWith(DOCTOR_NAME_PREFIX)) return value
  const rest = value
    .trimStart()
    .replace(/^(dr\(a\)\.?\s*|dr\.?\s*|dra\.?\s*)/i, "")
    .trimStart()
  return DOCTOR_NAME_PREFIX + rest
}

function doctorFormEmpty(): Omit<Doctor, "id" | "active"> {
  return {
    name: "",
    crm: "",
    specialty: "",
    shift: "",
    gender: "",
    cpf: "",
    birthDate: "",
    phone: "",
    email: "",
    zipCode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    notes: "",
  }
}

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
  const { items: doctors, remove, create, update, isPending } = useCRUD<Doctor>("/api/doctor")
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
  type DoctorForm = Omit<Doctor, "id" | "active">
  const { register, handleSubmit, reset, setValue, control, getValues, formState: { isSubmitting } } =
    useForm<DoctorForm>({ defaultValues: doctorFormEmpty() })

  function openCreate() {
    reset({ ...doctorFormEmpty(), name: DOCTOR_NAME_PREFIX })
    setModal({ open: true, editing: null })
  }
  function openEdit(d: Doctor) {
    reset(doctorFormEmpty())
    Object.entries(d)
      .filter(([k]) => k !== "id" && k !== "active")
      .forEach(([k, v]) => setValue(k as keyof DoctorForm, (v ?? "") as never))
    setModal({ open: true, editing: d })
  }
  function closeModal() {
    setModal({ open: false, editing: null })
    reset(doctorFormEmpty())
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

  async function handleSave(data: DoctorForm) {
    if (modal.editing) {
      await update(modal.editing.id, data, "Médico atualizado.")
    } else {
      const name = normalizeDoctorNameOnCreateInput(data.name)
      await create({ ...data, name, active: true }, "Médico cadastrado com sucesso!")
    }
    closeModal()
  }

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
        <ModalOverlay>
          <div className="max-h-[min(92vh,44rem)] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-4 shadow-lg sm:rounded-xl sm:p-6">
            <ModalHeader title={modal.editing ? "Editar médico" : "Novo médico"} onClose={closeModal} />
            <form onSubmit={handleSubmit(handleSave)} className="flex flex-col gap-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Dados profissionais</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="col-span-2">
                  {modal.editing ? (
                    <Input label="Nome completo" {...register("name", { required: true })} placeholder="Dr(a). Nome Sobrenome" />
                  ) : (
                    <Controller
                      name="name"
                      control={control}
                      rules={{ required: true }}
                      render={({ field }) => (
                        <Input
                          label="Nome completo"
                          placeholder="Nome e sobrenome após Dr(a)."
                          value={field.value}
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            field.onChange(normalizeDoctorNameOnCreateInput(e.target.value))
                          }
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      )}
                    />
                  )}
                </div>
                <Input label="CRM" {...register("crm", { required: true })} placeholder="CRM/UF 000000" />
                <Input label="Especialidade" {...register("specialty", { required: true })} placeholder="Ex: Psicologia" />
                <FormSelect label="Turno" {...register("shift")}>
                  <option value="">Selecione</option>
                  <option value="Manhã">Manhã</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Integral">Integral</option>
                </FormSelect>
                <FormSelect label="Sexo" {...register("gender")}>
                  <option value="">Selecione</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Outro">Outro</option>
                </FormSelect>
              </div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Dados pessoais</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Controller
                  name="cpf"
                  control={control}
                  render={({ field }) => (
                    <Input mask="cpf" label="CPF" placeholder="000.000.000-00" {...field} />
                  )}
                />
                <Input label="Data de nascimento" type="date" {...register("birthDate")} />
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <Input mask="telefone" label="Telefone" placeholder="(00) 00000-0000" {...field} />
                  )}
                />
                <Input label="Email" type="email" {...register("email")} placeholder="medico@clinica.com" />
                <div className="col-span-2">
                  <CepEnderecoBlock<DoctorForm>
                    control={control}
                    register={register}
                    setValue={setValue}
                    getValues={getValues}
                  />
                </div>
                <div className="col-span-2">
                  <Textarea label="Observações" rows={2} {...register("notes")} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-2">
                <Button type="button" variant="ghost" onClick={closeModal}>Cancelar</Button>
                <Button type="submit" size="md" disabled={isSubmitting}>
                  {modal.editing ? "Salvar alterações" : "Cadastrar médico"}
                </Button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      )}
    </div>
  )
}
