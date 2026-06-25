import type { LucideIcon } from "lucide-react"
import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Sun } from "lucide-react"

export function weatherIconForCode(code: number | null): LucideIcon {
  if (code === null) return Sun
  if (code === 0) return Sun
  if (code <= 3) return CloudSun
  if (code <= 48) return CloudFog
  if (code <= 67) return CloudRain
  if (code <= 77) return CloudSnow
  if (code <= 82) return CloudRain
  if (code <= 99) return CloudLightning
  return CloudSun
}

export function weatherIconClassForCode(code: number | null): string {
  if (code === null || code === 0) return "text-amber-400"
  if (code <= 3) return "text-amber-300"
  if (code <= 48) return "text-gray-400"
  if (code <= 67) return "text-sky-500"
  if (code <= 77) return "text-sky-300"
  if (code <= 99) return "text-violet-500"
  return "text-amber-400"
}
