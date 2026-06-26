"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

function UserAccountMenuSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex shrink-0 items-center gap-1.5 sm:gap-3", className)}>
      <div className="h-9 w-9 shrink-0 rounded-full bg-gray-200 animate-pulse sm:h-10 sm:w-10" />

      <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-gray-200/90 bg-white px-1.5 py-1 shadow-[0_2px_10px_rgba(15,23,42,0.06)] sm:gap-2 sm:px-2 sm:py-1 lg:gap-3">
        <div className="h-9 w-9 shrink-0 rounded-full bg-gray-200 animate-pulse sm:h-10 sm:w-10" />
        <div className="hidden h-4 w-20 rounded bg-gray-200 animate-pulse min-[400px]:block sm:w-24" />
        <div className="h-6 w-6 shrink-0 rounded-full bg-gray-100 animate-pulse sm:h-7 sm:w-7" />
      </div>
    </div>
  )
}

function HeaderWeatherWidgetSkeleton() {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <div className="h-3 w-32 rounded bg-gray-200 animate-pulse sm:h-4 sm:w-40 lg:w-48" />
      <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
        <div className="h-5 w-5 shrink-0 rounded-full bg-gray-200 animate-pulse sm:h-[22px] sm:w-[22px]" />
        <div className="h-7 w-14 rounded-md bg-gray-200 animate-pulse sm:h-8 sm:w-16 lg:h-9" />
      </div>
    </div>
  )
}

function HeaderQuickActionsSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-2 rounded-full border border-gray-100/80 bg-gray-50/40 px-2 py-1.5 sm:gap-2.5 sm:px-2.5 lg:gap-3 lg:px-3",
        className
      )}
    >
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-10 w-10 shrink-0 rounded-full bg-gray-200 animate-pulse sm:h-11 sm:w-11 lg:h-12 lg:w-12"
        />
      ))}
    </div>
  )
}

export function UserHeaderSkeleton({ showMobileMenu = false }: { showMobileMenu?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative min-w-0 shrink-0"
    >
      <Card className="relative isolate min-w-0 overflow-visible rounded-[20px] border-0 bg-transparent p-3 sm:p-4 lg:p-5">
        <div className="flex min-w-0 flex-col gap-3 sm:gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center lg:gap-6">
          <div className="relative z-30 flex min-w-0 items-center justify-between gap-2 lg:z-auto lg:justify-start lg:gap-3">
            <div className="min-w-0 flex-1 overflow-hidden pr-2">
              <HeaderWeatherWidgetSkeleton />
            </div>

            <UserAccountMenuSkeleton className="lg:hidden" />
          </div>

          <div className="relative z-0 flex min-w-0 justify-center lg:justify-self-center">
            <div className="flex max-w-full min-w-0 items-center justify-center gap-2 sm:gap-2.5">
              {showMobileMenu ? (
                <div className="h-9 w-9 shrink-0 rounded-full bg-gray-200 animate-pulse md:hidden sm:h-10 sm:w-10" />
              ) : null}
              <HeaderQuickActionsSkeleton className="min-w-0 max-w-full" />
            </div>
          </div>

          <div className="relative z-50 hidden min-w-0 shrink-0 items-center justify-end gap-3 lg:flex">
            <UserAccountMenuSkeleton />
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
