import type { LucideIcon } from "lucide-react"
import {
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
} from "lucide-react"

export function weatherIconForCode(code: number | null, isDay = true): LucideIcon {
  if (code === null) return isDay ? Sun : Moon
  if (code === 0) return isDay ? Sun : Moon
  if (code <= 3) return isDay ? CloudSun : CloudMoon
  if (code <= 48) return CloudFog
  if (code <= 67) return CloudRain
  if (code <= 77) return CloudSnow
  if (code <= 82) return CloudRain
  if (code <= 99) return CloudLightning
  return isDay ? CloudSun : CloudMoon
}

export function weatherIconClassForCode(code: number | null, isDay = true): string {
  if (code === null || code === 0) return isDay ? "text-amber-400" : "text-indigo-300"
  if (code <= 3) return isDay ? "text-amber-300" : "text-indigo-200"
  if (code <= 48) return "text-gray-400"
  if (code <= 67) return "text-sky-500"
  if (code <= 77) return "text-sky-300"
  if (code <= 99) return "text-violet-500"
  return isDay ? "text-amber-400" : "text-indigo-300"
}
