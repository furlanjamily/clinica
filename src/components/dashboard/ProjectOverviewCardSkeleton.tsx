"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

type ProjectOverviewCardSkeletonProps = {
  index?: number
  featured?: boolean
}

export function ProjectOverviewCardSkeleton({
  index = 0,
  featured = false,
}: ProjectOverviewCardSkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="h-[140px] min-w-0 overflow-hidden"
    >
      <div
        className={cn(
          "flex h-full flex-col overflow-hidden rounded-[24px] p-4",
          featured ? "bg-finance-card-gradient" : "bg-white shadow-sm"
        )}
      >
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div
            className={cn(
              "h-4 w-24 animate-pulse rounded",
              featured ? "bg-white/25" : "bg-gray-200"
            )}
          />
          <div
            className={cn(
              "h-10 w-10 shrink-0 animate-pulse rounded-full",
              featured ? "bg-white/20" : "bg-gray-100"
            )}
          />
        </div>

        <div
          className={cn(
            "mt-2 h-10 w-20 animate-pulse rounded",
            featured ? "bg-white/30" : "bg-gray-200"
          )}
        />

        <div className="mt-auto flex min-w-0 items-center gap-2 pt-2">
          <div
            className={cn(
              "h-6 w-14 shrink-0 animate-pulse rounded-full",
              featured ? "bg-white/20" : "bg-gray-100"
            )}
          />
          <div
            className={cn(
              "h-3 flex-1 animate-pulse rounded",
              featured ? "bg-white/20" : "bg-gray-100"
            )}
          />
        </div>
      </div>
    </motion.div>
  )
}
