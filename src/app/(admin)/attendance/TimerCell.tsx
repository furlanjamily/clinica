"use client"

import { useEffect, useState } from "react"
import type { Appointment } from "@/types/types"
import { calcElapsedMs } from "@/lib/schedule/appointment-utils"
import { formatDuration } from "@/lib/time/format-duration"

const RADIUS = 46
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
// O arco preenche de 68% a 86% conforme os segundos do minuto atual
const PROGRESS_BASE = 0.68
const PROGRESS_RANGE = 0.18

export function TimerCell({ item }: { item: Appointment }) {
  const [mounted, setMounted] = useState(false)
  const [, setTick] = useState(0)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (item.pausedAt) return
    const interval = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [item.pausedAt, item.startTime])

  const elapsedMs = mounted ? calcElapsedMs(item) : 0
  const progress = mounted
    ? PROGRESS_BASE + Math.min((elapsedMs % 60_000) / 60_000, 1) * PROGRESS_RANGE
    : PROGRESS_BASE
  const dashOffset = CIRCUMFERENCE * (1 - progress)

  return (
    <div className="relative flex h-36 w-36 items-center justify-center rounded-full">
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
        <circle
          cx="60"
          cy="60"
          r="49"
          fill="none"
          stroke="#201f24"
          strokeWidth="2"
          strokeDasharray="1 7"
          strokeLinecap="round"
          opacity="0.7"
        />
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          stroke="#ffd65a"
          strokeWidth="12"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        <span className="max-w-[4.5rem] font-mono text-base font-medium leading-none tracking-tight text-gray-950 sm:text-lg">
          {mounted ? formatDuration(elapsedMs) : "--:--"}
        </span>
        <span className="mt-0.5 text-[9px] font-medium uppercase tracking-wide text-gray-500">
          Tempo de atendimento
        </span>
      </div>
    </div>
  )
}
