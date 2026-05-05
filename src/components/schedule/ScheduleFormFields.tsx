"use client"

import type { ChangeEvent } from "react"
import Select from "@/components/ui/Select"
import { Input } from "@/components/ui/Input"

export type OptionItem = {
  value: string
  label: string
}

type ScheduleFormFieldsProps = {
  form: {
    pacienteId: string
    medicoId: string
    data: string
    horario: string
  }
  patientOptions: OptionItem[]
  doctorOptions: OptionItem[]
  horarioOptions: OptionItem[]
  minDate?: string
  onFieldChange: (name: keyof ScheduleFormFieldsProps["form"], value: string) => void
  onDateChange: (value: string) => void
}

export function ScheduleFormFields({
  form,
  patientOptions,
  doctorOptions,
  horarioOptions,
  minDate,
  onFieldChange,
  onDateChange,
}: ScheduleFormFieldsProps) {
  return (
    <>
      <Select
        options={patientOptions}
        value={form.pacienteId}
        onChange={(value) => onFieldChange("pacienteId", value)}
      />

      <Select
        options={doctorOptions}
        value={form.medicoId}
        onChange={(value) => onFieldChange("medicoId", value)}
      />

      <Input
        type="date"
        value={form.data}
        min={minDate}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onDateChange(e.target.value)}
      />

      <Select
        options={horarioOptions}
        value={form.horario}
        onChange={(value) => onFieldChange("horario", value)}
      />
    </>
  )
}
