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

interface GlobalFiltersProps {
  filters: FilterField[]
  values: Record<string, any>
  onChange: (name: string, value: any) => void
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
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-x-3 sm:gap-y-2">
      <span className="text-xs font-medium text-gray-500 sm:text-sm">Filtrar por</span>

      <div className="flex w-full flex-col gap-2 sm:flex-1 sm:flex-row sm:flex-wrap sm:items-end sm:gap-2">
        {filters.map((filter) => {
          if (filter.type === "select") {
            return (
              <div key={filter.name} className="min-w-0 w-full sm:w-auto sm:min-w-[11rem]">
                <Select
                  value={values[filter.name]}
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
                value={values[filter.name] || ""}
                onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(filter.name, e.target.value)}
                placeholder={filter.placeholder ?? "Buscar..."}
                className="min-w-0 w-full sm:w-auto sm:min-w-[10rem]"
              />
            )
          }

          if (filter.type === "date") {
            return (
              <Input
                key={filter.name}
                type="date"
                value={values[filter.name] || ""}
                onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(filter.name, e.target.value)}
                className="w-full min-w-0 sm:w-auto"
              />
            )
          }

          return null
        })}

        <button
          type="button"
          onClick={clearFilters}
          className="w-full rounded-md bg-gray-200 px-3 py-2 text-sm hover:bg-gray-300 sm:ml-0 sm:w-auto sm:shrink-0"
        >
          Limpar filtros
        </button>
      </div>
    </div>
  )
}