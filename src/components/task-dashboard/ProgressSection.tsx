"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

type ProgressSectionProps = {
  overall: number
  segments: { label: string; value: number; color: string }[]
  compact?: boolean
}

export function ProgressSection({ overall, segments, compact = false }: ProgressSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <div className={cn("flex items-center justify-between", compact ? "mb-3" : "mb-5")}>
        <h2
          className={cn(
            "font-medium text-gray-600",
            compact ? "text-sm" : "text-lg sm:text-xl"
          )}
        >
          Onboarding
        </h2>
        <span
          className={cn(
            "font-semibold text-gray-600",
            compact ? "text-lg" : "text-2xl sm:text-3xl"
          )}
        >
          {overall}%
        </span>
      </div>

      <div className={cn("flex items-center justify-between px-1", compact ? "mb-2" : "mb-3")}>
        {segments.map((segment, index) => (
          <div key={segment.label + index} className="flex flex-1 items-center justify-center">
            {index > 0 && (
              <div className="mr-2 hidden h-3 w-px bg-[#D4D0C4] sm:mr-3 sm:block" aria-hidden />
            )}
            <span className={cn("font-medium text-gray-500", compact ? "text-[10px]" : "text-xs sm:text-sm")}>
              {index === 0 ? `${segment.value}%` : segment.label}
            </span>
          </div>
        ))}
      </div>

      <div
        className={cn(
          "flex items-stretch gap-1.5 sm:gap-2",
          compact ? "h-10 sm:gap-2" : "h-14 sm:h-[4.5rem] sm:gap-3"
        )}
      >
        {segments.map((segment, index) => (
          <motion.div
            key={segment.label + index}
            className="relative flex flex-1 items-center justify-center overflow-hidden rounded-full bg-[#E8E4D8]"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
          >
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ backgroundColor: segment.color }}
              initial={{ width: "0%" }}
              animate={{
                width:
                  segment.value === 0 && segment.color === "#A9A9A9"
                    ? "100%"
                    : `${Math.max(segment.value, 8)}%`,
              }}
              transition={{ duration: 0.8, delay: 0.15 + index * 0.12, ease: "easeOut" }}
            />
            {index === 0 && (
              <span
                className={cn(
                  "relative z-10 font-semibold text-gray-600",
                  compact ? "text-[11px]" : "text-sm sm:text-base"
                )}
              >
                Task
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </motion.section>
  )
}
