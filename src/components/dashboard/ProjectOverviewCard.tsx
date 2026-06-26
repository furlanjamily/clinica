"use client"

import { motion } from "framer-motion"
import { ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"

export type ProjectOverviewCardData = {
  id: number
  title: string
  value: string | number
  growth?: string | number
  description: string
  featured?: boolean
}

type ProjectOverviewCardProps = {
  card: ProjectOverviewCardData
  index?: number
}

export function ProjectOverviewCard({ card, index = 0 }: ProjectOverviewCardProps) {
  const { title, value, growth, description, featured } = card

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ scale: 1.02 }}
      className="h-[140px] min-w-0 overflow-hidden"
    >
      <div
        className={cn(
          "flex h-full flex-col overflow-hidden rounded-[24px] p-4 transition-all duration-300 hover:-translate-y-0.5",
          featured
            ? "bg-finance-card-gradient text-white hover:-translate-y-0.5"
            : "bg-white shadow-sm hover:shadow-lg"
        )}
      >
        <div className="flex min-w-0 items-start justify-between gap-3">
          <p
            className={cn(
              "min-w-0 truncate text-sm font-medium",
              featured ? "text-white/90" : "text-gray-500"
            )}
          >
            {title}
          </p>
          <button
            type="button"
            aria-label={`Ver ${title}`}
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform duration-300 hover:scale-105",
              featured
                ? "bg-white/90 text-gray-600"
                : "border border-gray-200 bg-white text-gray-500"
            )}
          >
            <ArrowUpRight size={18} strokeWidth={2} />
          </button>
        </div>

        <p
          className={cn(
            "mt-2 text-[2.5rem] font-bold leading-none tracking-tight",
            featured ? "text-white" : "text-gray-600"
          )}
        >
          {value}
        </p>

        <div className="mt-auto flex min-w-0 items-center gap-2 pt-2">
          {growth != null && (
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-1 text-xs font-semibold text-finance-primary-hover",
                featured ? "bg-finance-light-bg" : "bg-gray-100"
              )}
            >
              <ArrowUpRight size={12} strokeWidth={2.5} />
              +{growth}
            </span>
          )}
          <span
            className={cn(
              "min-w-0 truncate text-xs font-medium",
              featured ? "text-finance-light-accent" : "text-finance-primary-hover"
            )}
          >
            {description}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
