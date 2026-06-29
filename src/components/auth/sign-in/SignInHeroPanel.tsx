"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { Check } from "lucide-react"

const HERO_FEATURES = ["Agenda", "Pacientes", "Financeiro", "Prontuário"] as const

export function SignInHeroPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="bg-white relative hidden h-full min-h-0 md:block md:w-[40%] lg:w-[55%]"
    >
      <Image
        src="/ImageSignIn.png"
        alt="Ambiente hospitalar"
        fill
        className="object-cover rounded-3xl"
        sizes="(max-width: 768px) 0px, 40vw "
        priority
      />

    </motion.div>
  )
}
