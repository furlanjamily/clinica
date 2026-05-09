"use client"

import { useEffect, useMemo, useState } from "react"
import type { Atendimento } from "@/types/types"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useScheduleOptions } from "@/hooks/useScheduleOptions"
import { ModalHeader } from "@/components/ui/ModalHeader"
import { ScheduleFormFields } from "@/components/schedule/ScheduleFormFields"
import { formatDateToInput, isDateDisabled, filterAvailableSlots } from "@/lib/schedule/form-utils"

type Props = {
  item?: Atendimento
  mode: "create" | "reschedule"
  onClose: () => void
  onSuccess: (item: Atendimento) => void
}

export function ScheduleFormModal({ item, mode, onClose, onSuccess }: Props) {
  const { doctors = [], patients = [] } = useScheduleOptions()

  const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>([])
  const [loadingHorarios, setLoadingHorarios] = useState(false)
  const [loading, setLoading] = useState(false)

  const isReschedule = mode === "reschedule" && !!item

  const [form, setForm] = useState({
    pacienteId: item?.paciente?.id ? String(item.paciente.id) : "",
    medicoId: "",
    data: formatDateToInput(item?.data),
    horario: item?.horario ?? "",
  })

  const hoje = new Date().toISOString().split("T")[0]
  const agora = new Date().toTimeString().slice(0, 5)

  const medicoSelecionado = useMemo(
    () => doctors.find((d) => String(d.id) === form.medicoId),
    [doctors, form.medicoId]
  )

  /* =========================
     🔥 BUSCA HORÁRIOS
  ========================= */
  useEffect(() => {
    if (!medicoSelecionado || !form.data) {
      setHorariosDisponiveis([])
      return
    }

    setLoadingHorarios(true)

    fetch(
      `/api/schedule/availability?medicoNome=${encodeURIComponent(
        medicoSelecionado.nome
      )}&data=${form.data}`
    )
      .then((r) => r.json())
      .then((data) => {
        const slots = data?.availableTimes ?? []

        const filtered = Array.isArray(slots)
          ? filterAvailableSlots(slots, form.data, hoje, agora)
          : []

        setHorariosDisponiveis(filtered)
      })
      .catch(() => setHorariosDisponiveis([]))
      .finally(() => setLoadingHorarios(false))
  }, [medicoSelecionado, form.data, hoje, agora])

  /* =========================
     OPTIONS
  ========================= */
  const patientOptions = useMemo(
    () => [
      { value: "", label: "Selecione um paciente" },
      ...patients.map((p) => ({
        value: String(p.id),
        label: p.nome,
      })),
    ],
    [patients]
  )

  const doctorOptions = useMemo(
    () => [
      { value: "", label: "Selecione um médico" },
      ...doctors.map((d) => ({
        value: String(d.id),
        label: d.nome,
      })),
    ],
    [doctors]
  )

  const horarioOptions = useMemo(
    () => [
      {
        value: "",
        label:
          medicoSelecionado && form.data
            ? loadingHorarios
              ? "Carregando horários..."
              : horariosDisponiveis.length > 0
              ? "Selecione um horário"
              : "Nenhum horário disponível"
            : "Selecione médico e data primeiro",
      },
      ...horariosDisponiveis.map((h) => ({
        value: h,
        label: h,
      })),
    ],
    [medicoSelecionado, form.data, horariosDisponiveis, loadingHorarios]
  )

  /* =========================
     SUBMIT
  ========================= */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.pacienteId || !form.medicoId || !form.data || !form.horario) {
      toast.error("Preencha todos os campos")
      return
    }

    if (isDateDisabled(form.data)) {
      toast.error("Não é possível agendar no domingo")
      return
    }

    const pacienteSelecionado = patients.find(
      (p) => String(p.id) === form.pacienteId
    )

    const medicoSelecionado = doctors.find(
      (d) => String(d.id) === form.medicoId
    )

    if (!pacienteSelecionado || !medicoSelecionado) {
      toast.error("Paciente ou médico inválido")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/schedule", {
        method: isReschedule ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item?.id,
          data: form.data,
          horario: form.horario,

          paciente: {
            id: pacienteSelecionado.id,
            nome: pacienteSelecionado.nome,
          },

          profissional: {
            id: medicoSelecionado.id,
            nome: medicoSelecionado.nome,
          },
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => null)
        toast.error(err?.message ?? "Erro ao salvar")
        return
      }

      const saved = await res.json()
      toast.success("Agendamento salvo!")

      onSuccess(saved)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div className="max-h-[min(92vh,40rem)] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-4 shadow-lg sm:rounded-xl sm:p-6">
        <ModalHeader
          title={isReschedule ? "Reagendar" : "Novo Agendamento"}
          onClose={onClose}
        />

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <ScheduleFormFields
            form={form}
            patientOptions={patientOptions}
            doctorOptions={doctorOptions}
            horarioOptions={horarioOptions}
            minDate={hoje}
            onFieldChange={(name, value) => setForm((p) => ({ ...p, [name]: value }))}
            onDateChange={(selectedDate) => {
              if (isDateDisabled(selectedDate)) {
                toast.error("Clínica fechada no domingo")
                return
              }
              setForm((p) => ({ ...p, data: selectedDate }))
            }}
          />

          <Button type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </div>
    </div>
  )
}