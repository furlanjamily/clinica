import { financeColors } from "@/components/finance/theme"

type SparklineTrend = "up" | "down" | "neutral"

type SparklineProps = {
  color: string
  fillOpacity?: number
  variant?: "line" | "area"
  trend?: SparklineTrend
  className?: string
}

type PathKey = "purple" | "secondary" | "accent" | "light"

const LINE_PATHS: Record<SparklineTrend, Record<PathKey, string>> = {
  up: {
    purple:
      "M0 28 C8 26, 14 18, 22 20 C30 22, 36 8, 44 10 C52 12, 58 4, 64 6 C70 8, 76 2, 80 0",
    secondary:
      "M0 20 C10 22, 18 16, 26 18 C34 20, 42 24, 50 14 C58 4, 66 10, 72 8 C76 7, 78 6, 80 4",
    accent:
      "M0 24 C12 22, 20 26, 28 20 C36 14, 44 18, 52 12 C60 6, 68 10, 76 6 C78 5, 79 4, 80 2",
    light:
      "M0 24 C8 22, 16 18, 24 16 C32 14, 40 10, 48 12 C56 14, 64 8, 72 6 C76 5, 78 4, 80 2",
  },
  down: {
    purple:
      "M0 4 C8 6, 14 14, 22 12 C30 10, 36 24, 44 22 C52 20, 58 28, 64 26 C70 24, 76 30, 80 32",
    secondary:
      "M0 12 C10 10, 18 16, 26 14 C34 12, 42 8, 50 18 C58 28, 66 22, 72 24 C76 25, 78 26, 80 28",
    accent:
      "M0 8 C12 10, 20 6, 28 12 C36 18, 44 14, 52 20 C60 26, 68 22, 76 26 C78 27, 79 28, 80 30",
    light:
      "M0 8 C8 10, 16 14, 24 16 C32 18, 40 22, 48 20 C56 18, 64 24, 72 26 C76 27, 78 28, 80 30",
  },
  neutral: {
    purple: "M0 16 C12 15, 24 17, 36 16 C48 15, 60 17, 72 16 C76 16, 78 16, 80 16",
    secondary: "M0 16 C12 17, 24 15, 36 16 C48 17, 60 15, 72 16 C76 16, 78 16, 80 16",
    accent: "M0 16 C12 16, 24 16, 36 16 C48 16, 60 16, 72 16 C76 16, 78 16, 80 16",
    light: "M0 16 C12 15, 24 17, 36 16 C48 15, 60 17, 72 16 C76 16, 78 16, 80 16",
  },
}

function resolvePathKey(color: string): PathKey {
  if (color === financeColors.lightAccent) return "light"
  if (color === financeColors.secondary) return "secondary"
  if (color === financeColors.primaryHover || color === financeColors.primaryDark) return "accent"
  return "purple"
}

export function Sparkline({
  color,
  fillOpacity = 0.35,
  variant = "area",
  trend = "up",
  className = "h-10 w-20",
}: SparklineProps) {
  const path = LINE_PATHS[trend][resolvePathKey(color)]

  return (
    <svg viewBox="0 0 80 32" fill="none" className={className} aria-hidden>
      {variant === "area" ? (
        <>
          <path d={`${path} L80 32 L0 32 Z`} fill={color} fillOpacity={fillOpacity} />
          <path d={path} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </>
      ) : (
        <path d={path} stroke={color} strokeWidth={2} strokeLinecap="round" />
      )}
    </svg>
  )
}
