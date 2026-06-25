"use client"

import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input, Textarea, FormSelect } from "@/components/ui/Input"
import { ModalHeader } from "@/components/ui/ModalHeader"
import { ModalOverlay } from "@/components/ui/modal-overlay"
import { CepEnderecoBlock } from "@/components/forms/CepEnderecoBlock"
import { useCRUD } from "@/hooks/useCRUD"
import type { Patient } from "@/types"

type PatientForm = Omit<Patient, "id">

function trimToNull(v: string | undefined | null): string | null {
  const t = (v ?? "").trim()
  return t === "" ? null : t
}

function patientFormEmpty(): PatientForm {
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

type Props = {
  patient?: Patient
  onClose: () => void
  onSuccess?: () => void
}

export function PatientFormModal({ patient, onClose, onSuccess }: Props) {
  const isEditing = !!patient
  const { create, update } = useCRUD<Patient>("/api/patient")
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    getValues,
    formState: { isSubmitting },
  } = useForm<PatientForm>({ defaultValues: patientFormEmpty() })

  useEffect(() => {
    reset(patientFormEmpty())
    if (!patient) return

    Object.entries(patient)
      .filter(([k]) => k !== "id")
      .forEach(([k, v]) => setValue(k as keyof PatientForm, (v ?? "") as never))
  }, [patient, reset, setValue])

  async function handleSave(data: PatientForm) {
    const payload = {
      ...data,
      insurancePlan: trimToNull(data.insurancePlan),
      insuranceNumber: trimToNull(data.insuranceNumber),
    }

    const result = isEditing
      ? await update(patient!.id, payload, "Paciente atualizado.")
      : await create(payload, "Paciente cadastrado com sucesso!")

    if (!result) return

    onSuccess?.()
    onClose()
  }

  return (
    <ModalOverlay>
      <div className="max-h-[min(92vh,44rem)] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-4 shadow-lg sm:rounded-xl sm:p-6">
        <ModalHeader
          title={isEditing ? "Editar paciente" : "Novo paciente"}
          onClose={onClose}
        />
        <form onSubmit={handleSubmit(handleSave)} className="flex flex-col gap-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Dados pessoais</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="col-span-full">
              <Input label="Nome completo" {...register("name", { required: true })} placeholder="Nome do paciente" />
            </div>
            <Input label="Data de nascimento" type="date" {...register("birthDate")} />
            <FormSelect label="Sexo" {...register("gender")}>
              <option value="">Selecione</option>
              <option>Masculino</option>
              <option>Feminino</option>
              <option>Outro</option>
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

          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Endereço</p>
          <CepEnderecoBlock<PatientForm>
            control={control}
            register={register}
            setValue={setValue}
            getValues={getValues}
          />

          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Convênio (opcional)</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Plano / convênio" {...register("insurancePlan")} placeholder="Deixe em branco se particular" />
            <Input label="Nº da carteirinha" {...register("insuranceNumber")} placeholder="Opcional" />
          </div>

          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Observações</p>
          <Textarea rows={3} {...register("notes")} placeholder="Alergias, condições pré-existentes, etc." />

          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" size="md" disabled={isSubmitting}>
              {isSubmitting
                ? "Salvando..."
                : isEditing
                  ? "Salvar alterações"
                  : "Cadastrar paciente"}
            </Button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  )
}
