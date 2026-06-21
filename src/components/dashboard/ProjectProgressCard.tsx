"use client"

import { motion } from "framer-motion"
import { dashboardColors } from "./theme"
import { Card } from "../ui/card"
import { useDashboard } from "./DashboardDataProvider"

const CX = 110
const CY = 110
const R = 72
const STROKE = 26

function degToRad(deg: number) {
  return (deg * Math.PI) / 180
}

function pointOnCircle(cx: number, cy: number, r: number, deg: number) {
  const rad = degToRad(deg)
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  }
}

function arcPath(startDeg: number, endDeg: number) {
  const start = pointOnCircle(CX, CY, R, startDeg)
  const end = pointOnCircle(CX, CY, R, endDeg)
  const sweep = endDeg - startDeg
  const largeArc = sweep > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${R} ${R} 0 ${largeArc} 1 ${end.x} ${end.y}`
}

function AnimatedArc({
  d,
  stroke,
  delay = 0,
}: {
  d: string
  stroke: string
  delay?: number
}) {
  return (
    <motion.path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={STROKE}
      strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0.5 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.9, delay, ease: "easeOut" }}
      style={{ pathLength: 1 }}
    />
  )
}

function LegendDot({ variant }: { variant: "completed" | "inProgress" | "pending" }) {
  if (variant === "pending") {
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
        <defs>
          <pattern id="pending-hatch-legend" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="4" height="4" fill="#E5E7EB" />
            <line x1="0" y1="0" x2="0" y2="4" stroke="#9CA3AF" strokeWidth="1.5" />
          </pattern>
        </defs>
        <circle cx="6" cy="6" r="6" fill="url(#pending-hatch-legend)" />
      </svg>
    )
  }

  const color = variant === "completed" ? dashboardColors.primary : dashboardColors.primaryHover
  return <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: color }} />
}

export function ProjectProgressCard() {
  const { data } = useDashboard()
  const breakdown = data?.statusBreakdown
  const completed = breakdown?.completed ?? 0
  const inProgress = breakdown?.inProgress ?? 0
  const pending = breakdown?.pending ?? 0
  const totalProgress = breakdown?.totalProgress ?? 0
  const totalRange = breakdown
    ? breakdown.counts.completed + breakdown.counts.inProgress + breakdown.counts.pending
    : 0
  const subtitle = `${totalRange} consultas ${data?.periodLabel ?? ""}`.trim()

  const totalArc = 180
  const startAngle = 180
  const completedEnd = startAngle + (completed / 100) * totalArc
  const inProgressEnd = completedEnd + (inProgress / 100) * totalArc
  const pendingEnd = 360

  return (
    <Card>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        whileHover={{ y: -2 }}
        className="mt-6 w-full flex flex-col p-2 justify-center items-center"
      >
        <h3 className="text-xl font-semibold text-gray-600">Status das consultas</h3>
        <div className="relative mx-auto mt-2 flex flex-1 flex-col items-center justify-center">
          <div className="relative h-[160px] w-[160px] sm:h-[180px] sm:w-[180px] lg:h-[220px] lg:w-[220px]">
            <svg
              viewBox="0 0 220 220"
              className="h-full w-full"
              aria-label={`Project progress ${totalProgress}%`}
            >
              <defs>
                <pattern
                  id="pending-hatch-chart"
                  width="8"
                  height="8"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)"
                >
                  <rect width="8" height="8" fill="#E5E7EB" />
                  <line x1="0" y1="0" x2="0" y2="8" stroke="#9CA3AF" strokeWidth="2" />
                </pattern>
              </defs>

              <AnimatedArc
                d={arcPath(startAngle, completedEnd)}
                stroke={dashboardColors.primary}
                delay={0.1}
              />
              <AnimatedArc
                d={arcPath(completedEnd, inProgressEnd)}
                stroke={dashboardColors.primaryHover}
                delay={0.25}
              />
              <AnimatedArc
                d={arcPath(inProgressEnd, pendingEnd)}
                stroke="url(#pending-hatch-chart)"
                delay={0.4}
              />
            </svg>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-1 sm:pb-2">
              <motion.p
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="text-4xl font-bold leading-none text-gray-600 sm:text-5xl lg:text-6xl"
              >
                {totalProgress}%
              </motion.p>
              <p className="mt-1 text-sm text-[#6B7280]">{subtitle}</p>
            </div>
          </div>

          <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 sm:gap-x-8">
            <li className="flex items-center gap-2">
              <LegendDot variant="completed" />
              <span className="text-sm text-[#6B7280]">Concluídas</span>
            </li>
            <li className="flex items-center gap-2">
              <LegendDot variant="inProgress" />
              <span className="text-sm text-[#6B7280]">Em andamento</span>
            </li>
            <li className="flex items-center gap-2">
              <LegendDot variant="pending" />
              <span className="text-sm text-[#6B7280]">Agendadas</span>
            </li>
          </ul>
        </div>
      </motion.div>
    </Card>
  )
}
