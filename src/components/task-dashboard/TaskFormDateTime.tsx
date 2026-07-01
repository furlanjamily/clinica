"use client"

import type { ChangeEvent } from "react"
import { toast } from "sonner"
import { Input } from "@/components/ui/Input"
import { getClinicNowTimeHHmm } from "@/lib/dashboard/agenda-entries"
import { isDateDisabled } from "@/lib/schedule/form-utils"
import { getTodayYYYYMMDD } from "@/lib/time/tz-date"
import { cn } from "@/lib/utils"

type TaskFormDateTimeProps = {
  date: string
  time: string
  minDate?: string
  onDateChange: (date: string) => void
  onTimeChange: (time: string) => void
  className?: string
}

export function TaskFormDateTime({
  date,
  time,
  minDate,
  onDateChange,
  onTimeChange,
  className,
}: TaskFormDateTimeProps) {
  const today = getTodayYYYYMMDD()
  const minTime = date === today ? getClinicNowTimeHHmm() : undefined

  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", className)}>
      <Input
        label="Data"
        type="date"
        value={date}
        min={minDate}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const selectedDate = e.target.value
          if (isDateDisabled(selectedDate)) {
            toast.error("Clínica fechada no domingo")
            return
          }
          onDateChange(selectedDate)
        }}
      />

      <Input
        label="Horário"
        type="time"
        value={time}
        min={minTime}
        step={60}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onTimeChange(e.target.value)}
      />
    </div>
  )
}
