"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import type { ReactNode } from "react"
import { SignInHeroPanel } from "./SignInHeroPanel"
import { SignInVisitorCard } from "./SignInVisitorCard"

type SignInLayoutProps = {
  children: ReactNode
  onVisitorSignIn: () => void
}

export function SignInLayout({ children, onVisitorSignIn }: SignInLayoutProps) {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-white shadow-[0_8px_40px_rgba(0,0,0,0.08)] p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex h-[90vh] w-full max-w-[1500px] overflow-hidden"
      >
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex min-h-0 w-full flex-col justify-center overflow-y-auto px-8 py-10 sm:px-12 md:w-[60%] md:px-10 lg:w-[45%] lg:px-16"
        >
          <Image
            src="/logo.svg"
            alt="ClinySOFT"
            width={139}
            height={27}
            className="mb-10 shrink-0 rounded-3xl"
            priority
            unoptimized
          />

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-secondary sm:text-3xl">Faça login</h1>
            <p className="mt-2 text-sm text-accent">
              Acesso exclusivo para administradores e profissionais da clínica.
            </p>
          </div>

          {children}

          <div className="my-8 flex items-center gap-4" role="separator" aria-label="ou">
            <span className="h-px flex-1 bg-gray-200" />
            <span className="text-xs font-medium text-accent">ou</span>
            <span className="h-px flex-1 bg-gray-200" />
          </div>

          <SignInVisitorCard onVisitorSignIn={onVisitorSignIn} />
        </motion.div>

        <SignInHeroPanel />
      </motion.div>
    </div>
  )
}
