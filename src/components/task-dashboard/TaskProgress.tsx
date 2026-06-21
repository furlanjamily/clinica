"use client"

type TaskProgressProps = {
  completed: number
  total: number
  compact?: boolean
}

export function TaskProgress({ completed, total, compact = false }: TaskProgressProps) {
  return (
    <span
      className={
        compact
          ? "text-xl font-semibold tracking-tight text-white sm:text-2xl"
          : "text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl"
      }
    >
      {completed}/{total}
    </span>
  )
}
