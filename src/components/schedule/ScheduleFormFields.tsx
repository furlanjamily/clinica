"use client"

import type { ChangeEvent } from "react"
import Select from "@/components/ui/Select"
import { Input } from "@/components/ui/Input"

export type OptionItem = {
  value: string
  label: string
}

export type ScheduleFormState = {
  patientId: string
  doctorId: string
  date: string
  slotTime: string
}

type ScheduleFormFieldsProps = {
  form: ScheduleFormState
  patientOptions: OptionItem[]
  doctorOptions: OptionItem[]
  slotOptions: OptionItem[]
  minDate?: string
  onFieldChange: (name: keyof ScheduleFormState, value: string) => void
  onDateChange: (value: string) => void
}

export function ScheduleFormFields({
  form,
  patientOptions,
  doctorOptions,
  slotOptions,
  minDate,
  onFieldChange,
  onDateChange,
}: ScheduleFormFieldsProps) {
  return (
    <>
      <Select
        options={patientOptions}
        value={form.patientId}
        onChange={(value) => onFieldChange("patientId", value)}
      />

      <Select
        options={doctorOptions}
        value={form.doctorId}
        onChange={(value) => onFieldChange("doctorId", value)}
      />

      <Input
        type="date"
        value={form.date}
        min={minDate}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onDateChange(e.target.value)}
      />

      <Select
        options={slotOptions}
        value={form.slotTime}
        onChange={(value) => onFieldChange("slotTime", value)}
      />
    </>
  )
}
