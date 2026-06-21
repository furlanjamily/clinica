"use client"

import { motion } from "framer-motion"
import { ArrowUpRight } from "lucide-react"

export function ProjectOverviewCard({ card, index = 0 }) {
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
        className={[
          "flex h-full flex-col overflow-hidden rounded-[24px] p-4 transition-all duration-300",
          featured
            ? "text-white hover:-translate-y-0.5"
            : "bg-white shadow-sm hover:-translate-y-0.5 hover:shadow-lg",
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
          <p
            className={[
              "min-w-0 truncate text-sm font-medium",
              featured ? "text-white/90" : "text-gray-500",
            ].join(" ")}
          >
            {title}
          </p>
          <button
            type="button"
            aria-label={`View ${title}`}
            className={[
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform duration-300 hover:scale-105",
              featured
                ? "bg-white/90 text-gray-600"
                : "border border-gray-200 bg-white text-gray-500",
            ].join(" ")}
          >
            <ArrowUpRight size={18} strokeWidth={2} />
          </button>
        </div>

        <p
          className={[
            "mt-2 text-[2.5rem] font-bold leading-none tracking-tight",
            featured ? "text-white" : "text-gray-600",
          ].join(" ")}
        >
          {value}
        </p>

        <div className="mt-auto flex min-w-0 items-center gap-2 pt-2">
          {growth != null && (
            <span
              className="inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-1 text-xs font-semibold"
              style={{
                background: featured ? "#F3EEFF" : "#F3F4F6",
                color: "#8538F0",
              }}
            >
              <ArrowUpRight size={12} strokeWidth={2.5} />
              +{growth}
            </span>
          )}
          <span
            className={[
              "min-w-0 truncate text-xs font-medium",
              featured ? "text-[#E9D5FF]" : "text-[#8538F0]",
            ].join(" ")}
          >
            {description}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
