"use client"

import type { ChangeEvent } from "react"
import Select from "../Select"
import { Input } from "@/components/ui/Input"

export type FilterField = {
  name: string
  type: "select" | "input" | "date" | "time"
  placeholder?: string
  options?: {
    value: string
    label: string
    color?: string
  }[]
}

type FilterValue = string | number | undefined

interface GlobalFiltersProps {
  filters: FilterField[]
  values: Record<string, FilterValue>
  onChange: (name: string, value: string) => void
}

function toInputValue(value: FilterValue): string {
  return value === undefined ? "" : String(value)
}

export function GlobalFilters({
  filters,
  values,
  onChange
}: GlobalFiltersProps) {

  function clearFilters() {
    filters.forEach((filter) => {
      onChange(filter.name, "")
    })
  }
  return (
    <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-end">
      <span className="shrink-0 p-1 text-xs font-medium text-gray-500 sm:text-sm">Filtrar por</span>

      <div className="flex min-w-0 flex-1 flex-wrap items-end justify-center gap-2">
        {filters.map((filter) => {
          if (filter.type === "select") {
            return (
              <div key={filter.name} className="min-w-0 w-full sm:w-auto sm:min-w-[8rem]">
                <Select
                  value={toInputValue(values[filter.name])}
                  onChange={(value) => onChange(filter.name, value)}
                  options={filter.options || []}
                />
              </div>
            )
          }

          if (filter.type === "input") {
            return (
              <Input
                key={filter.name}
                value={toInputValue(values[filter.name])}
                onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(filter.name, e.target.value)}
                placeholder={filter.placeholder ?? "Buscar..."}
                className="min-w-0 w-full sm:w-auto sm:min-w-[8rem]"
              />
            )
          }

          if (filter.type === "date") {
            return (
              <Input
                key={filter.name}
                type="date"
                value={toInputValue(values[filter.name])}
                onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(filter.name, e.target.value)}
                className="w-full min-w-0 sm:w-auto"
              />
            )
          }

          return null
        })}
      </div>

      <button
        type="button"
        onClick={clearFilters}
        className="shrink-0 self-end rounded-3xl bg-gray-200 px-3 py-2 text-sm hover:bg-gray-300"
      >
        Limpar
      </button>
    </div>
  )
}