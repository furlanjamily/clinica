"use client"

import type { ChangeEvent } from "react"
import Select from "@/components/ui/Select"
import { Input } from "@/components/ui/Input"
import { cn } from "@/lib/utils"

export type ScheduleOptionItem = {
  value: string
  label: string
}

type ScheduleDateTimeFieldsProps = {
  date: string
  time: string
  slotOptions: ScheduleOptionItem[]
  minDate?: string
  onDateChange: (value: string) => void
  onTimeChange: (value: string) => void
  className?: string
}

export function ScheduleDateTimeFields({
  date,
  time,
  slotOptions,
  minDate,
  onDateChange,
  onTimeChange,
  className,
}: ScheduleDateTimeFieldsProps) {
  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", className)}>
      <Input
        label="Data"
        type="date"
        value={date}
        min={minDate}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onDateChange(e.target.value)}
      />

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-700">Horário</span>
        <Select
          options={slotOptions}
          value={time}
          onChange={onTimeChange}
          className="w-full min-w-0"
        />
      </div>
    </div>
  )
}
