"use client"

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
    <div className="flex items-center gap-3 flex-wrap">

      <span className="text-sm text-gray-500 font-medium">
        Filtrar por
      </span>

      {filters.map((filter) => {

        if (filter.type === "select") {
          return (
            <Select
              key={filter.name}
              value={values[filter.name]}
              onChange={(value) => onChange(filter.name, value)}
              options={filter.options || []}
            />
          )
        }

        if (filter.type === "input") {
          return (
            <Input
              key={filter.name}
              value={values[filter.name] || ""}
              onChange={(e) => onChange(filter.name, e.target.value)}
              placeholder={filter.placeholder ?? "Buscar..."}
              className="min-w-[160px]"
            />
          )
        }

        if (filter.type === "date") {
          return (
            <Input
              key={filter.name}
              type="date"
              value={values[filter.name] || ""}
              onChange={(e) => onChange(filter.name, e.target.value)}
              className="w-auto"
            />
          )
        }

        return null
      })}

      <button
        onClick={clearFilters}
        className="ml-2 px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-md"
      >
        Limpar
      </button>

    </div>
  )
}