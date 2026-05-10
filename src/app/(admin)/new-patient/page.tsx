"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCRUD } from "@/hooks/useCRUD"
import { Patient } from "@/types"
import { Header } from "@/components/ui/PageHeader"
import { ModalHeader } from "@/components/ui/ModalHeader"
import { Input, Textarea, FormSelect } from "@/components/ui/Input"
import { TableSkeleton } from "@/components/ui/TableSkeleton"
import { CepEnderecoBlock } from "@/components/forms/CepEnderecoBlock"

function trimToNull(v: string | undefined | null): string | null {
  const t = (v ?? "").trim()
  return t === "" ? null : t
}

function normalizePatientPayload(data: Omit<Patient, "id">): Omit<Patient, "id"> {
  return {
    ...data,
    insurancePlan: trimToNull(data.insurancePlan),
    insuranceNumber: trimToNull(data.insuranceNumber),
  }
}

function patientFormEmpty(): Omit<Patient, "id"> {
  return {
    name: "",
    birthDate: "",
    gender: "",
    cpf: "",
    phone: "",
    email: "",
    zipCode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    insurancePlan: "",
    insuranceNumber: "",
    notes: "",
    maritalStatus: "",
    education: "",
    religion: "",
    profession: "",
  }
}

function PatientsTable({
  patients,
  onEdit,
  onRemove,
}: {
  patients: Patient[]
  onEdit: (p: Patient) => void
  onRemove: (id: number, successMsg?: string) => void
}) {
  if (patients.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-accent text-sm">
        Nenhum paciente cadastrado
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-y-2 min-w-[500px]">
        <thead>
          <tr>
            {["Nome", "CPF", "Telefone", "Convênio", "Ações"].map((h) => (
              <th key={h} className="text-left text-xs px-3 text-gray-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {patients.map((p) => (
            <tr key={p.id} className="bg-white shadow-sm">
              <td className="p-3 text-sm font-medium">{p.name}</td>
              <td className="p-3 text-sm text-gray-600">{p.cpf ?? "—"}</td>
              <td className="p-3 text-sm text-gray-600">{p.phone ?? "—"}</td>
              <td className="p-3 text-sm text-gray-600">{p.insurancePlan ?? "—"}</td>
              <td className="p-3">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" onClick={() => onEdit(p)}><Pencil size={14} /> Editar</Button>
                  <Button variant="ghost-danger" onClick={() => onRemove(p.id, "Paciente removido.")}><Trash2 size={14} /> Remover</Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function PatientsPage() {
  const { items: patients, remove, create, update, isPending } = useCRUD<Patient>("/api/patient")
  const [modal, setModal] = useState<{ open: boolean; editing: Patient | null }>({ open: false, editing: null })
  type PatientForm = Omit<Patient, "id">
  const { register, handleSubmit, reset, setValue, control, getValues, formState: { isSubmitting } } =
    useForm<PatientForm>({ defaultValues: patientFormEmpty() })

  function openCreate() {
    reset(patientFormEmpty())
    setModal({ open: true, editing: null })
  }
  function openEdit(p: Patient) {
    reset(patientFormEmpty())
    Object.entries(p)
      .filter(([k]) => k !== "id")
      .forEach(([k, v]) => setValue(k as keyof PatientForm, (v ?? "") as never))
    setModal({ open: true, editing: p })
  }
  function closeModal() {
    setModal({ open: false, editing: null })
    reset(patientFormEmpty())
  }

  async function handleSave(data: PatientForm) {
    const payload = normalizePatientPayload(data)
    if (modal.editing) {
      await update(modal.editing.id, payload, "Paciente atualizado.")
    } else {
      await create(payload, "Paciente cadastrado com sucesso!")
    }
    closeModal()
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <Header title="Pacientes">
        <Button size="md" onClick={openCreate}>
          <Plus size={16} /> <span className="hidden sm:inline">Novo paciente</span>
        </Button>
      </Header>

      <div className="mt-3 min-h-0 flex-1 overflow-auto sm:mt-4">
        {isPending ? (
          <TableSkeleton cols={5} rows={6} />
        ) : (
          <PatientsTable patients={patients} onEdit={openEdit} onRemove={remove} />
        )}
      </div>

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="max-h-[min(92vh,44rem)] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-4 shadow-lg sm:rounded-xl sm:p-6">
            <ModalHeader title={modal.editing ? "Editar paciente" : "Novo paciente"} onClose={closeModal} />
            <form onSubmit={handleSubmit(handleSave)} className="flex flex-col gap-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Dados pessoais</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-full">
                  <Input label="Nome completo" {...register("name", { required: true })} placeholder="Nome do paciente" />
                </div>
                <Input label="Data de nascimento" type="date" {...register("birthDate")} />
                <FormSelect label="Sexo" {...register("gender")}>
                  <option value="">Selecione</option>
                  <option>Masculino</option><option>Feminino</option><option>Outro</option>
                </FormSelect>
                <Controller
                  name="cpf"
                  control={control}
                  render={({ field }) => (
                    <Input mask="cpf" label="CPF" placeholder="000.000.000-00" {...field} />
                  )}
                />
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <Input mask="telefone" label="Telefone" placeholder="(00) 00000-0000" {...field} />
                  )}
                />
                <div className="col-span-full">
                  <Input label="E-mail" type="email" {...register("email")} placeholder="email@exemplo.com" />
                </div>
              </div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Endereço</p>
              <CepEnderecoBlock<PatientForm>
                control={control}
                register={register}
                setValue={setValue}
                getValues={getValues}
              />
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Convênio (opcional)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Plano / convênio" {...register("insurancePlan")} placeholder="Deixe em branco se particular" />
                <Input label="Nº da carteirinha" {...register("insuranceNumber")} placeholder="Opcional" />
              </div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Observações</p>
              <Textarea rows={3} {...register("notes")} placeholder="Alergias, condições pré-existentes, etc." />
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
                <Button type="button" variant="ghost" onClick={closeModal}>Cancelar</Button>
                <Button type="submit" size="md" disabled={isSubmitting}>
                  {modal.editing ? "Salvar alterações" : "Cadastrar paciente"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
