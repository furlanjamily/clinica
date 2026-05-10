"use client"

import { useEffect, useMemo, useState } from "react"
import type { Appointment } from "@/types/types"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useScheduleOptions } from "@/hooks/useScheduleOptions"
import { ModalHeader } from "@/components/ui/ModalHeader"
import { ScheduleFormFields } from "@/components/schedule/ScheduleFormFields"
import { formatDateToInput, isDateDisabled, filterAvailableSlots } from "@/lib/schedule/form-utils"

type Props = {
  item?: Appointment
  mode: "create" | "reschedule"
  onClose: () => void
  onSuccess: (item: Appointment) => void
}

export function ScheduleFormModal({ item, mode, onClose, onSuccess }: Props) {
  const { doctors = [], patients = [] } = useScheduleOptions()

  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [loading, setLoading] = useState(false)

  const isReschedule = mode === "reschedule" && !!item

  const [form, setForm] = useState({
    patientId: item?.patient?.id ? String(item.patient.id) : "",
    doctorId: "",
    date: formatDateToInput(item?.date),
    slotTime: item?.slotTime ?? "",
  })

  const todayIso = new Date().toISOString().split("T")[0]
  const nowTime = new Date().toTimeString().slice(0, 5)

  const selectedDoctor = useMemo(
    () => doctors.find((d) => String(d.id) === form.doctorId),
    [doctors, form.doctorId]
  )

  useEffect(() => {
    if (!selectedDoctor || !form.date) {
      setAvailableSlots([])
      return
    }

    setLoadingSlots(true)

    fetch(
      `/api/schedule/availability?doctorName=${encodeURIComponent(
        selectedDoctor.name
      )}&date=${form.date}`
    )
      .then((r) => r.json())
      .then((data) => {
        const slots = data?.availableTimes ?? []

        const filtered = Array.isArray(slots)
          ? filterAvailableSlots(slots, form.date, todayIso, nowTime)
          : []

        setAvailableSlots(filtered)
      })
      .catch(() => setAvailableSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [selectedDoctor, form.date, todayIso, nowTime])

  const patientOptions = useMemo(
    () => [
      { value: "", label: "Selecione um paciente" },
      ...patients.map((p) => ({
        value: String(p.id),
        label: p.name,
      })),
    ],
    [patients]
  )

  const doctorOptions = useMemo(
    () => [
      { value: "", label: "Selecione um médico" },
      ...doctors.map((d) => ({
        value: String(d.id),
        label: d.name,
      })),
    ],
    [doctors]
  )

  const slotOptions = useMemo(
    () => [
      {
        value: "",
        label:
          selectedDoctor && form.date
            ? loadingSlots
              ? "Carregando horários..."
              : availableSlots.length > 0
              ? "Selecione um horário"
              : "Nenhum horário disponível"
            : "Selecione médico e data primeiro",
      },
      ...availableSlots.map((h) => ({
        value: h,
        label: h,
      })),
    ],
    [selectedDoctor, form.date, availableSlots, loadingSlots]
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.patientId || !form.doctorId || !form.date || !form.slotTime) {
      toast.error("Preencha todos os campos")
      return
    }

    if (isDateDisabled(form.date)) {
      toast.error("Não é possível agendar no domingo")
      return
    }

    const selectedPatient = patients.find(
      (p) => String(p.id) === form.patientId
    )

    const doctorForSubmit = doctors.find(
      (d) => String(d.id) === form.doctorId
    )

    if (!selectedPatient || !doctorForSubmit) {
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
          date: form.date,
          slotTime: form.slotTime,

          patient: {
            id: selectedPatient.id,
            name: selectedPatient.name,
          },

          professional: {
            id: doctorForSubmit.id,
            name: doctorForSubmit.name,
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
            slotOptions={slotOptions}
            minDate={todayIso}
            onFieldChange={(name, value) => setForm((p) => ({ ...p, [name]: value }))}
            onDateChange={(selectedDate) => {
              if (isDateDisabled(selectedDate)) {
                toast.error("Clínica fechada no domingo")
                return
              }
              setForm((p) => ({ ...p, date: selectedDate }))
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
