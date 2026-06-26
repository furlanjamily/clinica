"use client"

import { useMemo, useState } from "react"
import type { Appointment } from "@/types/types"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useScheduleOptions } from "@/hooks/useScheduleOptions"
import { useScheduleAvailability } from "@/hooks/useScheduleAvailability"
import { useScheduleMutations } from "@/hooks/useScheduleMutations"
import { ModalHeader } from "@/components/ui/ModalHeader"
import { ModalOverlay, ModalPanel } from "@/components/ui/modal-overlay"
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
  const { createAppointment, patchAppointment } = useScheduleMutations()
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

  const { data: rawSlots = [], isPending: loadingSlots } = useScheduleAvailability(
    selectedDoctor?.name,
    form.date
  )

  const availableSlots = useMemo(
    () => filterAvailableSlots(rawSlots, form.date, todayIso, nowTime),
    [rawSlots, form.date, todayIso, nowTime]
  )

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
      const payload = {
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
      }

      const saved = isReschedule && item
        ? await patchAppointment(item.id, payload)
        : await createAppointment(payload)

      if (!saved) return

      onSuccess(saved)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalOverlay>
      <ModalPanel>
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
      </ModalPanel>
    </ModalOverlay>
  )
}
