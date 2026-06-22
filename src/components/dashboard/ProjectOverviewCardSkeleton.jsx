"use client"

import { motion } from "framer-motion"

export function ProjectOverviewCardSkeleton({ index = 0, featured = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="h-[140px] min-w-0 overflow-hidden"
    >
      <div
        className={[
          "flex h-full flex-col overflow-hidden rounded-[24px] p-4",
          featured ? "" : "bg-white shadow-sm",
        ].join(" ")}
        style={
          featured
            ? {
                background:
                  "linear-gradient(135deg, #5B21B6 0%, #8538F0 50%, #9747FF 100%)",
              }
            : { background: "#FFFFFF" }
        }
      >
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div
            className={[
              "h-4 w-24 rounded animate-pulse",
              featured ? "bg-white/25" : "bg-gray-200",
            ].join(" ")}
          />
          <div
            className={[
              "h-10 w-10 shrink-0 rounded-full animate-pulse",
              featured ? "bg-white/20" : "bg-gray-100",
            ].join(" ")}
          />
        </div>

        <div
          className={[
            "mt-2 h-10 w-20 rounded animate-pulse",
            featured ? "bg-white/30" : "bg-gray-200",
          ].join(" ")}
        />

        <div className="mt-auto flex min-w-0 items-center gap-2 pt-2">
          <div
            className={[
              "h-6 w-14 shrink-0 rounded-full animate-pulse",
              featured ? "bg-white/20" : "bg-gray-100",
            ].join(" ")}
          />
          <div
            className={[
              "h-3 flex-1 rounded animate-pulse",
              featured ? "bg-white/20" : "bg-gray-100",
            ].join(" ")}
          />
        </div>
      </div>
    </motion.div>
  )
}
