"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { TableSkeleton } from "@/components/ui/TableSkeleton"
import { Button } from "@/components/ui/button"
import { useCRUD } from "@/hooks/useCRUD"
import { Patient } from "@/types"
import { Header } from "@/components/ui/PageHeader"
import { ModalHeader } from "@/components/ui/ModalHeader"
import { Input, Textarea, FormSelect } from "@/components/ui/Input"

export default function PatientsPage() {
  const { items: patients, loading, create, update, remove } = useCRUD<Patient>("/api/patient")
  const [modal, setModal] = useState<{ open: boolean; editing: Patient | null }>({ open: false, editing: null })
  const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm<Omit<Patient, "id">>()

  function openCreate() { reset(); setModal({ open: true, editing: null }) }
  function openEdit(p: Patient) {
    Object.entries(p).forEach(([k, v]) => setValue(k as any, v ?? ""))
    setModal({ open: true, editing: p })
  }
  function closeModal() { setModal({ open: false, editing: null }); reset() }

  async function handleSave(data: any) {
    if (modal.editing) {
      await update(modal.editing.id, data, "Paciente atualizado.")
    } else {
      await create(data, "Paciente cadastrado com sucesso!")
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

      <div className="flex-1 overflow-auto">
        {loading ? <TableSkeleton cols={5} rows={6} /> : patients.length === 0 ? (
          <div className="flex items-center justify-center h-full text-accent text-sm">Nenhum paciente cadastrado</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-2 min-w-[500px]">
              <thead>
                <tr>{["Nome", "CPF", "Telefone", "Convênio", "Ações"].map((h) => (
                  <th key={h} className="text-left text-xs px-3 text-gray-500">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.id} className="bg-white shadow-sm">
                    <td className="p-3 text-sm font-medium">{p.nome}</td>
                    <td className="p-3 text-sm text-gray-600">{p.cpf ?? "—"}</td>
                    <td className="p-3 text-sm text-gray-600">{p.telefone ?? "—"}</td>
                    <td className="p-3 text-sm text-gray-600">{p.convenio ?? "—"}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <Button variant="ghost" onClick={() => openEdit(p)}><Pencil size={14} /> Editar</Button>
                        <Button variant="ghost-danger" onClick={() => remove(p.id, "Paciente removido.")}><Trash2 size={14} /> Remover</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-lg">
            <ModalHeader title={modal.editing ? "Editar paciente" : "Novo paciente"} onClose={closeModal} />
            <form onSubmit={handleSubmit(handleSave)} className="flex flex-col gap-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Dados pessoais</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-full">
                  <Input label="Nome completo" {...register("nome", { required: true })} placeholder="Nome do paciente" />
                </div>
                <Input label="Data de nascimento" type="date" {...register("dataNascimento")} />
                <FormSelect label="Sexo" {...register("sexo")}>
                  <option value="">Selecione</option>
                  <option>Masculino</option><option>Feminino</option><option>Outro</option>
                </FormSelect>
                <Input label="CPF" {...register("cpf")} placeholder="000.000.000-00" />
                <Input label="Telefone" {...register("telefone")} placeholder="(00) 00000-0000" />
                <div className="col-span-full">
                  <Input label="E-mail" type="email" {...register("email")} placeholder="email@exemplo.com" />
                </div>
              </div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Endereço</p>
              <Input {...register("endereco")} placeholder="Rua, número, bairro, cidade" />
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Convênio</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input {...register("convenio")} placeholder="Nome do convênio" />
                <Input {...register("numeroConvenio")} placeholder="Número da carteirinha" />
              </div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Observações</p>
              <Textarea rows={3} {...register("observacoes")} placeholder="Alergias, condições pré-existentes, etc." />
              <div className="flex justify-end gap-3 mt-2">
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
