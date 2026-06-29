"use client"

import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"
import Image from "next/image"

export function PortfolioVisitorLoading() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100/90 px-4 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Entrando como visitante"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-[380px] overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-[0_16px_48px_rgba(0,0,0,0.12)]"
      >
        <div className="h-1.5 w-full bg-gradient-to-r from-primary/30 via-primary to-primary/30" aria-hidden="true" />

        <div className="flex flex-col items-center px-8 py-10 text-center">
          <Image
            src="/logo.svg"
            alt="ClinySOFT"
            width={120}
            height={24}
            className="mb-8"
            priority
            unoptimized
          />

          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
          </div>

          <p className="text-lg font-semibold text-secondary">Entrando como visitante…</p>
          <p className="mt-2 max-w-[260px] text-sm leading-relaxed text-accent">
            Preparando o ambiente de demonstração para você explorar o ClinySOFT.
          </p>

          <div className="mt-8 flex items-center gap-1.5" aria-hidden="true">
            {[0, 1, 2].map((dot) => (
              <motion.span
                key={dot}
                className="h-2 w-2 rounded-full bg-primary/40"
                animate={{ opacity: [0.35, 1, 0.35], scale: [0.85, 1, 0.85] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: dot * 0.2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
