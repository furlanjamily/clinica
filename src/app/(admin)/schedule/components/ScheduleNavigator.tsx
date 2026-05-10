"use client"

import {
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react"
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { useEffect, useRef, useState } from "react"
import { DatePicker } from "@/components/ui/DatePicker"
import { Button } from "@/components/ui/button"
import type { ViewMode } from "@/hooks/useSchedule"


type Props = {
  date: Date
  view: ViewMode
  onChangeDate: (date: Date) => void
  onChangeView: (view: ViewMode) => void
}

export function ScheduleNavigator({
  date,
  view,
  onChangeDate,
  onChangeView,
}: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function previous() {
    if (view === "dia") onChangeDate(addDays(date, -1))
    if (view === "semana") onChangeDate(addDays(date, -7))
    if (view === "mes" || view === "lista") onChangeDate(addMonths(date, -1))
  }

  function next() {
    if (view === "dia") onChangeDate(addDays(date, 1))
    if (view === "semana") onChangeDate(addDays(date, 7))
    if (view === "mes" || view === "lista") onChangeDate(addMonths(date, 1))
  }

  function goToday() {
    onChangeDate(new Date())
  }

  let formattedDate = ""

  if (view === "mes" || view === "lista") {
    formattedDate = format(date, "MMMM 'de' yyyy", { locale: ptBR })
  }

  if (view === "dia") {
    formattedDate = format(date, "dd/MM/yyyy", {
      locale: ptBR,
    })
  }

  if (view === "semana") {
    const start = startOfWeek(date, { weekStartsOn: 1 })
    const end = endOfWeek(date, { weekStartsOn: 1 })

    formattedDate = `${format(start, "dd/MM")} - ${format(
      end,
      "dd/MM/yyyy"
    )}`
  }

  return (
    <div
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full relative gap-3 md:gap-4"
      ref={ref}
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3 md:gap-1">
        <Button variant="outline" size="icon" onClick={previous} aria-label="Período anterior">
          <ChevronLeft className="size-[18px] md:size-5" />
        </Button>

        <Button
          variant="ghost"
          onClick={() => setOpen((prev) => !prev)}
          className="min-w-0 max-w-full gap-2 text-left text-sm sm:text-base md:text-lg md:px-3"
        >
          <Calendar className="size-4 shrink-0 md:size-[18px]" />
          <span className="truncate">{formattedDate}</span>
        </Button>

        <Button variant="outline" size="icon" onClick={next} aria-label="Próximo período">
          <ChevronRight className="size-[18px] md:size-5" />
        </Button>

        <Button variant="secondary" size="md" onClick={goToday} className="shrink-0 text-sm sm:text-base md:text-lg">
          Hoje
        </Button>

        {open && (
          <div className="absolute left-0 top-12 z-50 sm:left-auto md:top-14">
            <DatePicker
              date={date}
              onChange={(d) => { onChangeDate(d); setOpen(false) }}
            />
          </div>
        )}
      </div>

      <div className="flex w-full shrink-0 flex-wrap gap-2 sm:w-auto sm:justify-end md:gap-3">
        {["dia", "semana", "mes"].map((mode) => (
          <Button
            key={mode}
            variant={view === mode ? "purple" : "secondary"}
            size="md"
            className="flex-1 text-xs sm:flex-none sm:text-sm md:text-base"
            onClick={() => onChangeView(mode as ViewMode)}
          >
            {mode === "mes" && "Mês"}
            {mode === "dia" && "Dia"}
            {mode === "semana" && "Semana"}
          </Button>
        ))}
      </div>
    </div>
  )
}
