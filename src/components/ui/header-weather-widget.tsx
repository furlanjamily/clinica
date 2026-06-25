"use client"

import { createElement, useMemo } from "react"
import { cn } from "@/lib/utils"
import { useLocalWeather } from "@/hooks/useLocalWeather"
import { weatherIconClassForCode, weatherIconForCode } from "@/lib/weather/weather-icons"

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatHeaderDate(date: Date) {
  const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(date)
  const day = date.getDate()
  const month = new Intl.DateTimeFormat("pt-BR", { month: "short" })
    .format(date)
    .replace(".", "")

  return `${capitalize(weekday)}, ${day} ${capitalize(month)}`
}

function WeatherIconDisplay({ code, loading }: { code: number | null; loading: boolean }) {
  const iconClass = weatherIconClassForCode(code)

  return createElement(weatherIconForCode(code), {
    size: 20,
    strokeWidth: 2.25,
    className: cn(
      "shrink-0 sm:h-[22px] sm:w-[22px]",
      loading ? "animate-pulse text-amber-300" : iconClass
    ),
    "aria-hidden": true,
  })
}

export function HeaderWeatherWidget({ className }: { className?: string }) {
  const { data, loading } = useLocalWeather()
  const dateLabel = useMemo(() => formatHeaderDate(new Date()), [])

  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5", className)}>
      <p className="truncate text-[11px] font-medium tracking-wide text-gray-400 sm:text-xs lg:text-sm">
        {dateLabel}
      </p>

      <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
        <WeatherIconDisplay code={data?.weatherCode ?? null} loading={loading} />
        <p className="truncate text-lg font-bold tabular-nums tracking-tight text-gray-600 sm:text-xl lg:text-2xl">
          {loading ? (
            <span className="inline-block h-7 w-14 animate-pulse rounded-md bg-gray-100" />
          ) : data ? (
            `${data.temperature}°C`
          ) : (
            "—°C"
          )}
        </p>
      </div>
    </div>
  )
}
