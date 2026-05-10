"use client"

import { useState, type ChangeEvent } from "react"
import { useForm, Controller } from "react-hook-form"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCRUD } from "@/hooks/useCRUD"
import { Doctor } from "@/types"
import { Header } from "@/components/ui/PageHeader"
import { ModalHeader } from "@/components/ui/ModalHeader"
import { Input, Textarea, FormSelect } from "@/components/ui/Input"
import { TableSkeleton } from "@/components/ui/TableSkeleton"
import { CepEnderecoBlock } from "@/components/forms/CepEnderecoBlock"

export const dynamic = "force-dynamic"

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

function doctorFormEmpty(): Omit<Doctor, "id" | "ativo"> {
  return {
    nome: "",
    crm: "",
    especialidade: "",
    turno: "",
    sexo: "",
    cpf: "",
    dataNascimento: "",
    telefone: "",
    email: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
    observacoes: "",
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

  if (doctors.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-accent text-sm">
        Nenhum médico cadastrado
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-y-2 min-w-[600px]">
        <thead>
          <tr>
            {["Nome", "CRM", "Especialidade", "Turno", "Contato", "Ações"].map((h) => (
              <th key={h} className="text-left text-xs px-3 text-gray-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {doctors.map((d) => (
            <tr key={d.id} className={`bg-white shadow-sm ${!d.ativo ? "opacity-40" : ""}`}>
              <td className="p-3 text-sm font-medium">{d.nome}</td>
              <td className="p-3 text-sm text-gray-600">{d.crm}</td>
              <td className="p-3 text-sm text-gray-600">{d.especialidade}</td>
              <td className="p-3 text-sm text-gray-600">{d.turno ?? "—"}</td>
              <td className="p-3 text-sm text-gray-600">{d.telefone ?? d.email ?? "—"}</td>
              <td className="p-3">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" onClick={() => onEdit(d)}><Pencil size={14} /> Editar</Button>
                  <Button variant="ghost-danger" onClick={() => onRemove(d.id, "Médico removido.")}><Trash2 size={14} /> Remover</Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function DoctorsPage() {
  const { items: doctors, remove, create, update, isPending } = useCRUD<Doctor>("/api/doctor")
  const [modal, setModal] = useState<{ open: boolean; editing: Doctor | null }>({ open: false, editing: null })
  type DoctorForm = Omit<Doctor, "id" | "ativo">
  const { register, handleSubmit, reset, setValue, control, getValues, formState: { isSubmitting } } =
    useForm<DoctorForm>({ defaultValues: doctorFormEmpty() })

  function openCreate() {
    reset({ ...doctorFormEmpty(), nome: DOCTOR_NAME_PREFIX })
    setModal({ open: true, editing: null })
  }
  function openEdit(d: Doctor) {
    reset(doctorFormEmpty())
    Object.entries(d)
      .filter(([k]) => k !== "id" && k !== "ativo")
      .forEach(([k, v]) => setValue(k as keyof DoctorForm, (v ?? "") as never))
    setModal({ open: true, editing: d })
  }
  function closeModal() {
    setModal({ open: false, editing: null })
    reset(doctorFormEmpty())
  }

  async function handleSave(data: DoctorForm) {
    if (modal.editing) {
      await update(modal.editing.id, data, "Médico atualizado.")
    } else {
      const nome = normalizeDoctorNameOnCreateInput(data.nome)
      await create({ ...data, nome, ativo: true }, "Médico cadastrado com sucesso!")
    }
    closeModal()
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <Header title="Médicos">
        <Button size="md" onClick={openCreate}>
          <Plus size={16} /> Novo médico
        </Button>
      </Header>

      <div className="flex-1 overflow-auto mt-4">
        {isPending ? (
          <TableSkeleton cols={6} rows={6} />
        ) : (
          <DoctorsTable doctors={doctors} onEdit={openEdit} onRemove={remove} />
        )}
      </div>

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="max-h-[min(92vh,44rem)] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-4 shadow-lg sm:rounded-xl sm:p-6">
            <ModalHeader title={modal.editing ? "Editar médico" : "Novo médico"} onClose={closeModal} />
            <form onSubmit={handleSubmit(handleSave)} className="flex flex-col gap-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Dados profissionais</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="col-span-2">
                  {modal.editing ? (
                    <Input label="Nome completo" {...register("nome", { required: true })} placeholder="Dr(a). Nome Sobrenome" />
                  ) : (
                    <Controller
                      name="nome"
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
                <Input label="Especialidade" {...register("especialidade", { required: true })} placeholder="Ex: Psicologia" />
                <FormSelect label="Turno" {...register("turno")}>
                  <option value="">Selecione</option>
                  <option value="Manhã">Manhã</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Integral">Integral</option>
                </FormSelect>
                <FormSelect label="Sexo" {...register("sexo")}>
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
                <Input label="Data de nascimento" type="date" {...register("dataNascimento")} />
                <Controller
                  name="telefone"
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
                  <Textarea label="Observações" rows={2} {...register("observacoes")} />
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
        </div>
      )}
    </div>
  )
}
