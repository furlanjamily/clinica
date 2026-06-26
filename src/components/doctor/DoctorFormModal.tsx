"use client"

import { type ChangeEvent, useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input, Textarea, FormSelect } from "@/components/ui/Input"
import { ModalHeader } from "@/components/ui/ModalHeader"
import { ModalOverlay, ModalPanel } from "@/components/ui/modal-overlay"
import { CepEnderecoBlock } from "@/components/forms/CepEnderecoBlock"
import { useCRUD } from "@/hooks/useCRUD"
import type { Doctor } from "@/types"

const DOCTOR_NAME_PREFIX = "Dr(a). "

function normalizeDoctorNameOnCreateInput(value: string): string {
  if (value.startsWith(DOCTOR_NAME_PREFIX)) return value
  const rest = value
    .trimStart()
    .replace(/^(dr\(a\)\.?\s*|dr\.?\s*|dra\.?\s*)/i, "")
    .trimStart()
  return DOCTOR_NAME_PREFIX + rest
}

type DoctorForm = Omit<Doctor, "id" | "active">

function doctorFormEmpty(): DoctorForm {
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

type Props = {
  doctor?: Doctor
  onClose: () => void
  onSuccess?: () => void
}

export function DoctorFormModal({ doctor, onClose, onSuccess }: Props) {
  const isEditing = !!doctor
  const { create, update } = useCRUD<Doctor>("/api/doctor")
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    getValues,
    formState: { isSubmitting },
  } = useForm<DoctorForm>({ defaultValues: doctorFormEmpty() })

  useEffect(() => {
    reset(isEditing ? doctorFormEmpty() : { ...doctorFormEmpty(), name: DOCTOR_NAME_PREFIX })
    if (!doctor) return

    Object.entries(doctor)
      .filter(([k]) => k !== "id" && k !== "active")
      .forEach(([k, v]) => setValue(k as keyof DoctorForm, (v ?? "") as never))
  }, [doctor, isEditing, reset, setValue])

  async function handleSave(data: DoctorForm) {
    if (isEditing) {
      const updated = await update(doctor!.id, data, "Médico atualizado.")
      if (!updated) return
    } else {
      const name = normalizeDoctorNameOnCreateInput(data.name)
      const created = (await create(
        { ...data, name, active: true },
        "Médico cadastrado com sucesso!"
      )) as (Doctor & { loginAccount?: { email: string; temporaryPassword: string } }) | null

      if (!created) return

      if (created.loginAccount) {
        toast.info(
          `Usuário criado automaticamente: ${created.loginAccount.email} / senha ${created.loginAccount.temporaryPassword}`,
          { duration: 12000 }
        )
      }
    }

    onSuccess?.()
    onClose()
  }

  return (
    <ModalOverlay>
      <ModalPanel size="lg">
        <ModalHeader
          title={isEditing ? "Editar médico" : "Novo médico"}
          onClose={onClose}
        />
        <form onSubmit={handleSubmit(handleSave)} className="flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Dados profissionais</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="col-span-2">
              {isEditing ? (
                <Input
                  label="Nome completo"
                  {...register("name", { required: true })}
                  placeholder="Dr(a). Nome Sobrenome"
                />
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

          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Dados pessoais</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

          <div className="mt-2 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" size="md" disabled={isSubmitting}>
              {isSubmitting
                ? "Salvando..."
                : isEditing
                  ? "Salvar alterações"
                  : "Cadastrar médico"}
            </Button>
          </div>
        </form>
      </ModalPanel>
    </ModalOverlay>
  )
}
