"use client"

import { useEffect, useMemo, useState } from "react"
import type { Appointment } from "@/types/types"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useScheduleOptions } from "@/hooks/useScheduleOptions"
import { useScheduleAvailability } from "@/hooks/useScheduleAvailability"
import { useScheduleMutations } from "@/hooks/useScheduleMutations"
import { ModalHeader } from "@/components/ui/ModalHeader"
import { ModalOverlay, ModalPanel } from "@/components/ui/modal-overlay"
import { ScheduleFormFields } from "@/components/schedule/ScheduleFormFields"
import { getInitialScheduleForm, isDateDisabled, filterAvailableSlots, ensureOption, resolveScheduleSelection } from "@/lib/schedule/form-utils"
import { AppointmentStatus } from "@/lib/schedule/status"

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

  const [form, setForm] = useState(() => getInitialScheduleForm(item))

  useEffect(() => {
    if (item) setForm(getInitialScheduleForm(item))
  }, [item])

  const todayIso = new Date().toISOString().split("T")[0]
  const nowTime = new Date().toTimeString().slice(0, 5)

  const patientOptions = useMemo(() => {
    const base = [
      { value: "", label: "Selecione um paciente" },
      ...patients.map((p) => ({
        value: String(p.id),
        label: p.name,
      })),
    ]

    if (!isReschedule || !item) return base

    const patientId = String(item.patient?.id ?? item.patientId ?? "")
    const patientName = item.patient?.name ?? item.patientName ?? "Paciente"
    return ensureOption(base, patientId, patientName)
  }, [patients, isReschedule, item])

  const doctorOptions = useMemo(() => {
    const base = [
      { value: "", label: "Selecione um médico" },
      ...doctors.map((d) => ({
        value: String(d.id),
        label: d.name,
      })),
    ]

    if (!isReschedule || !item?.doctorId) return base

    return ensureOption(base, String(item.doctorId), item.professionalName || "Médico")
  }, [doctors, isReschedule, item])

  const selectedDoctor = useMemo(() => {
    const fromList = doctors.find((d) => String(d.id) === form.doctorId)
    if (fromList) return fromList

    const option = doctorOptions.find((entry) => entry.value === form.doctorId)
    if (option && form.doctorId) {
      return { id: Number(form.doctorId), name: option.label }
    }

    return undefined
  }, [doctors, form.doctorId, doctorOptions])

  const { data: rawSlots = [], isPending: loadingSlots } = useScheduleAvailability(
    selectedDoctor?.name,
    form.date
  )

  const availableSlots = useMemo(
    () => filterAvailableSlots(rawSlots, form.date, todayIso, nowTime),
    [rawSlots, form.date, todayIso, nowTime]
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

    const selectedPatient = resolveScheduleSelection(form.patientId, patients, {
      id: item?.patient?.id ?? item?.patientId,
      name: item?.patient?.name ?? item?.patientName,
    })

    const selectedDoctorForSubmit = resolveScheduleSelection(form.doctorId, doctors, {
      id: item?.doctorId,
      name: item?.professionalName,
    })

    if (!selectedPatient || !selectedDoctorForSubmit) {
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
          id: selectedDoctorForSubmit.id,
          name: selectedDoctorForSubmit.name,
        },
      }

      const hasScheduleChanges =
        form.date !== item?.date ||
        form.slotTime !== item?.slotTime ||
        form.doctorId !== String(item.doctorId ?? "")

      const saved = isReschedule && item
        ? await patchAppointment(item.id, {
            date: form.date,
            slotTime: form.slotTime,
            professional: {
              id: selectedDoctorForSubmit.id,
              name: selectedDoctorForSubmit.name,
            },
            ...(hasScheduleChanges ? { status: AppointmentStatus.Rescheduled } : {}),
          })
        : await createAppointment(payload)

      if (!saved) return

      onSuccess(saved)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
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
            disablePatient={isReschedule}
            onFieldChange={(name, value) => {
              setForm((current) => {
                if (name === "doctorId" && value !== current.doctorId) {
                  return { ...current, doctorId: value, slotTime: "" }
                }
                return { ...current, [name]: value }
              })
            }}
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
