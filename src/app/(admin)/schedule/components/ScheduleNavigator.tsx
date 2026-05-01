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
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full relative gap-3"
      ref={ref}
    >
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="outline" size="icon" onClick={previous}>
          <ChevronLeft size={18} />
        </Button>

        <Button
          variant="ghost"
          onClick={() => setOpen((prev) => !prev)}
        >
          <Calendar size={16} />
          {formattedDate}
        </Button>

        <Button variant="outline" size="icon" onClick={next}>
          <ChevronRight size={18} />
        </Button>

        <Button variant="secondary" onClick={goToday}>
          Hoje
        </Button>

        {open && (
          <div className="absolute top-12 left-0 z-50">
            <DatePicker
              date={date}
              onChange={(d) => { onChangeDate(d); setOpen(false) }}
            />
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {["dia", "semana", "mes"].map((mode) => (
          <Button
            key={mode}
            variant={view === mode ? "purple" : "secondary"}
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
