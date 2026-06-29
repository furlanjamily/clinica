"use client"

import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

type SignInVisitorCardProps = {
  onVisitorSignIn: () => void
}

export function SignInVisitorCard({ onVisitorSignIn }: SignInVisitorCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.25 }}
      className="rounded-2xl border border-primary/10 bg-[#fafafa] p-5"
    >
      <p className="text-sm font-semibold text-secondary">
        <span aria-hidden="true">👋 </span>
        Explorar demonstração
      </p>
      <p className="mt-1 text-xs text-accent">
        Conheça a ClinySOFT sem precisar fazer login.
      </p>


      <button
        type="button"
        onClick={onVisitorSignIn}
        aria-label="Entrar como visitante"
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-[14px] border border-primary/20 bg-white text-sm font-semibold text-primary transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        Entrar como visitante
        <ArrowRight size={16} aria-hidden="true" />
      </button>
    </motion.div>
  )
}
