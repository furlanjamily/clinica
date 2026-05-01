"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { ModalHeader } from "@/components/ui/ModalHeader"
import { Textarea } from "@/components/ui/Input"
import { MedicalRecord } from "@/types"

type FormData = {
  clinicalDiagnosis?: string
  diagnosisReactions?: string
  emotionalState?: string
  personalHistory?: string
  psychicExam?: string
  psychologicalConduct?: string
  familyGuidance?: string
}

type Props = {
  data?: MedicalRecord
  atendimento: {
    id: number
    pacienteNome: string
    profissionalNome?: string
    horario: string
  }
  onClose: () => void
  onSave: (data: FormData & { atendimentoId: number }) => void
}

export function MedicalRecordModal({
  data,
  atendimento,
  onClose,
  onSave,
}: Props) {
  const { register, handleSubmit, reset } = useForm<FormData>({
    defaultValues: {
      clinicalDiagnosis: "",
      diagnosisReactions: "",
      emotionalState: "",
      personalHistory: "",
      psychicExam: "",
      psychologicalConduct: "",
      familyGuidance: "",
    },
  })

  useEffect(() => {
    if (data) {
      reset({
        clinicalDiagnosis: data.clinicalDiagnosis,
        diagnosisReactions: data.diagnosisReactions,
        emotionalState: data.emotionalState,
        personalHistory: data.personalHistory,
        psychicExam: data.psychicExam,
        psychologicalConduct: data.psychologicalConduct,
        familyGuidance: data.familyGuidance,
      })
    }
  }, [data, reset])

  function handleFormSubmit(formData: FormData) {
    onSave({
      ...formData,
      atendimentoId: atendimento.id,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">

        <ModalHeader
          title={data ? "Editar Prontuário" : "Novo Prontuário"}
          onClose={onClose}
        />

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4">

          <p className="text-xs font-semibold text-gray-400 uppercase">
            Atendimento
          </p>

          <div className="bg-gray-50 p-4 rounded-xl">
            <p className="font-semibold">{atendimento.pacienteNome}</p>
            <p className="text-xs text-gray-500">{atendimento.profissionalNome}</p>
            <p className="text-xs text-gray-500">{atendimento.horario}</p>
          </div>

          <Textarea label="Diagnóstico clínico" {...register("clinicalDiagnosis")} />
          <Textarea label="Reações ao diagnóstico" {...register("diagnosisReactions")} />
          <Textarea label="Estado emocional" {...register("emotionalState")} />
          <Textarea label="Histórico pessoal/familiar" {...register("personalHistory")} />
          <Textarea label="Exame psíquico" {...register("psychicExam")} />
          <Textarea label="Conduta psicológica" {...register("psychologicalConduct")} />
          <Textarea label="Orientações" {...register("familyGuidance")} />

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {data ? "Salvar alterações" : "Criar prontuário"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}