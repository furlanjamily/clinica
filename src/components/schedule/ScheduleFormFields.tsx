"use client"

import Select from "@/components/ui/Select"
import {
  ScheduleDateTimeFields,
  type ScheduleOptionItem,
} from "@/components/schedule/ScheduleDateTimeFields"

export type OptionItem = ScheduleOptionItem

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
  disablePatient?: boolean
  disableDoctor?: boolean
  onFieldChange: (name: keyof ScheduleFormState, value: string) => void
  onDateChange: (value: string) => void
}

export function ScheduleFormFields({
  form,
  patientOptions,
  doctorOptions,
  slotOptions,
  minDate,
  disablePatient = false,
  disableDoctor = false,
  onFieldChange,
  onDateChange,
}: ScheduleFormFieldsProps) {
  return (
    <>
      <Select
        options={patientOptions}
        value={form.patientId}
        onChange={(value) => onFieldChange("patientId", value)}
        disabled={disablePatient}
      />

      <Select
        options={doctorOptions}
        value={form.doctorId}
        onChange={(value) => onFieldChange("doctorId", value)}
        disabled={disableDoctor}
      />

      <ScheduleDateTimeFields
        date={form.date}
        time={form.slotTime}
        slotOptions={slotOptions}
        minDate={minDate}
        onDateChange={onDateChange}
        onTimeChange={(value) => onFieldChange("slotTime", value)}
      />
    </>
  )
}
