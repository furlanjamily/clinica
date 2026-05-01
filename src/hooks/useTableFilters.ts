import { useCallback, useState } from "react"

export function useTableFilters<T extends Record<string, any>>(initialFilters: T) {
  const [filters, setFilters] = useState<T>(initialFilters)

  const handleFilterChange = useCallback(
    (name: keyof T, value: T[keyof T] | "") => {
      setFilters((current) => ({
        ...current,
        [name]: value,
      }))
    },
    []
  )

  const clearFilters = useCallback(() => {
    setFilters(initialFilters)
  }, [initialFilters])

  return {
    filters,
    setFilters,
    handleFilterChange,
    clearFilters,
  }
}
