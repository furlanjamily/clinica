import { financeColors } from "@/components/finance/theme"

type SparklineProps = {
  color: string
  fillOpacity?: number
  variant?: "line" | "area"
  className?: string
}

const LINE_PATHS = {
  purple:
    "M0 28 C8 26, 14 18, 22 20 C30 22, 36 8, 44 10 C52 12, 58 4, 64 6 C70 8, 76 2, 80 0",
  secondary:
    "M0 20 C10 22, 18 16, 26 18 C34 20, 42 24, 50 14 C58 4, 66 10, 72 8 C76 7, 78 6, 80 4",
  accent:
    "M0 24 C12 22, 20 26, 28 20 C36 14, 44 18, 52 12 C60 6, 68 10, 76 6 C78 5, 79 4, 80 2",
  light:
    "M0 24 C8 22, 16 18, 24 16 C32 14, 40 10, 48 12 C56 14, 64 8, 72 6 C76 5, 78 4, 80 2",
}

function resolvePathKey(color: string): keyof typeof LINE_PATHS {
  if (color === financeColors.lightAccent) return "light"
  if (color === financeColors.secondary) return "secondary"
  if (color === financeColors.primaryHover || color === financeColors.primaryDark) return "accent"
  return "purple"
}

export function Sparkline({
  color,
  fillOpacity = 0.35,
  variant = "area",
  className = "h-10 w-20",
}: SparklineProps) {
  const path = LINE_PATHS[resolvePathKey(color)]

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
