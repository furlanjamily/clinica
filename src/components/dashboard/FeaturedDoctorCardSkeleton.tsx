"use client"

import { motion } from "framer-motion"
import { Card } from "../ui/card"

export function FeaturedDoctorCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="flex h-full w-full min-h-[400px] flex-col"
    >
      <Card className="flex h-[600px] flex-col rounded-[20px] border-0 bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.05)] lg:flex-1">
        <div className="relative h-full overflow-hidden rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <div className="h-full w-full bg-gray-100 animate-pulse" />

          <div className="absolute top-3 left-1/2 h-6 w-24 -translate-x-1/2 rounded-full bg-gray-200 animate-pulse" />

          <div className="absolute inset-x-0 bottom-0 rounded-b-[20px] bg-white/80 px-4 pb-4 pt-3 backdrop-blur-md sm:px-5 sm:pb-5 sm:pt-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="h-5 w-36 rounded bg-gray-200 animate-pulse" />
              <div className="h-9 w-9 shrink-0 rounded-full bg-gray-200 animate-pulse sm:h-10 sm:w-10" />
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
