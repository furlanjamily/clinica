"use client"

import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input, Textarea, FormSelect } from "@/components/ui/Input"
import { ModalHeader } from "@/components/ui/ModalHeader"
import { ModalOverlay, ModalPanel } from "@/components/ui/modal-overlay"
import { CepEnderecoBlock } from "@/components/forms/CepEnderecoBlock"
import { ProfileImageUpload } from "@/components/common/ProfileImageUpload"
import { useCRUD } from "@/hooks/useCRUD"
import { usePatientImageMutation } from "@/hooks/usePatientImageMutation"
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
  const queryClient = useQueryClient()
  const { create, update } = useCRUD<Patient>("/api/patient")
  const { uploadImage, removeImage, isUploading, isRemoving } = usePatientImageMutation()
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    getValues,
    watch,
    formState: { isSubmitting },
  } = useForm<PatientForm>({ defaultValues: patientFormEmpty() })

  const patientName = watch("name")

  useEffect(() => {
    reset(patientFormEmpty())
    setPendingFile(null)
    setRemovePhoto(false)
    if (!patient) return

    Object.entries(patient)
      .filter(([k]) => k !== "id" && k !== "image")
      .forEach(([k, v]) => setValue(k as keyof PatientForm, (v ?? "") as never))
  }, [patient, reset, setValue])

  async function syncProfileImage(patientId: number | undefined) {
    if (!patientId) return

    if (removePhoto && (patient?.image || pendingFile)) {
      await removeImage(patientId)
    } else if (pendingFile) {
      await uploadImage({ file: pendingFile, patientId })
    }

    await queryClient.invalidateQueries({ queryKey: ["crud", "/api/patient"] })
  }

  async function handleSave(data: PatientForm) {
    const payload = {
      ...data,
      insurancePlan: trimToNull(data.insurancePlan),
      insuranceNumber: trimToNull(data.insuranceNumber),
    }

    if (isEditing) {
      const result = await update(patient!.id, payload, "Paciente atualizado.")
      if (!result) return
      await syncProfileImage(patient!.id)
    } else {
      const result = await create(payload, "Paciente cadastrado com sucesso!")
      if (!result) return
      if (pendingFile) {
        await uploadImage({ file: pendingFile, patientId: result.id })
        await queryClient.invalidateQueries({ queryKey: ["crud", "/api/patient"] })
      }
    }

    onSuccess?.()
    onClose()
  }

  const currentImage = removePhoto ? null : (patient?.image ?? null)
  const saving = isSubmitting || isUploading || isRemoving

  return (
    <ModalOverlay onClose={onClose}>
      <ModalPanel size="lg">
        <ModalHeader
          title={isEditing ? "Editar paciente" : "Novo paciente"}
          onClose={onClose}
        />
        <form onSubmit={handleSubmit(handleSave)} className="flex flex-col gap-5">
          <ProfileImageUpload
            name={patientName || patient?.name}
            imageUrl={currentImage}
            onFileSelected={(file) => {
              setPendingFile(file)
              setRemovePhoto(false)
            }}
            onRemove={() => {
              setPendingFile(null)
              setRemovePhoto(true)
            }}
            isUploading={isUploading || isRemoving}
            disabled={saving}
          />

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
            <Button type="submit" size="md" disabled={saving}>
              {saving
                ? "Salvando..."
                : isEditing
                  ? "Salvar alterações"
                  : "Cadastrar paciente"}
            </Button>
          </div>
        </form>
      </ModalPanel>
    </ModalOverlay>
  )
}
