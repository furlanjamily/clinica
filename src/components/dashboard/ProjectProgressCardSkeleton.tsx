"use client"

import { motion } from "framer-motion"
import { Card } from "../ui/card"

export function ProjectProgressCardSkeleton() {
  return (
    <Card>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="mt-6 flex w-full flex-col items-center justify-center p-2"
      >
        <div className="h-6 w-44 rounded bg-gray-200 animate-pulse" />

        <div className="relative mx-auto mt-2 flex flex-1 flex-col items-center justify-center">
          <div className="relative h-[160px] w-[160px] sm:h-[180px] sm:w-[180px] lg:h-[220px] lg:w-[220px]">
            <div className="absolute inset-0 rounded-full border-[26px] border-gray-100 border-t-gray-200 animate-pulse" />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-1 sm:pb-2">
              <div className="h-12 w-20 rounded bg-gray-200 animate-pulse sm:h-14 sm:w-24" />
              <div className="mt-2 h-4 w-32 rounded bg-gray-100 animate-pulse" />
            </div>
          </div>

          <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 sm:gap-x-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-gray-200 animate-pulse" />
                <div className="h-4 w-20 rounded bg-gray-100 animate-pulse" />
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </Card>
  )
}
