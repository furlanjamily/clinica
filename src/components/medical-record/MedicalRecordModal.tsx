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
    /** Data da consulta (YYYY-MM-DD), se disponível */
    data?: string
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-4 shadow-lg sm:rounded-xl sm:p-6">

        <ModalHeader
          title={data ? "Editar prontuário" : "Novo prontuário"}
          onClose={onClose}
        />

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4">

          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Agendamento #{atendimento.id}
          </p>

          <div className="flex flex-col gap-2 rounded-xl bg-gray-50 p-3 sm:p-4">
            <p className="min-w-0 break-words font-semibold text-gray-900">{atendimento.pacienteNome}</p>
            <p className="text-xs leading-relaxed text-gray-600 sm:text-sm">
              {[atendimento.data, `às ${atendimento.horario}`, atendimento.profissionalNome].filter(Boolean).join(" · ")}
            </p>
          </div>


          <Textarea label="Diagnóstico clínico" {...register("clinicalDiagnosis")} />
          <Textarea label="Reações ao diagnóstico" {...register("diagnosisReactions")} />
          <Textarea label="Estado emocional" {...register("emotionalState")} />
          <Textarea label="Histórico pessoal/familiar" {...register("personalHistory")} />
          <Textarea label="Exame psíquico" {...register("psychicExam")} />
          <Textarea label="Conduta psicológica" {...register("psychologicalConduct")} />
          <Textarea label="Orientações" {...register("familyGuidance")} />

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
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