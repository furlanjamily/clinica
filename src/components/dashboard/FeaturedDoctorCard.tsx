"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { MessageCircle } from "lucide-react"
import { useDashboard } from "./DashboardDataProvider"
import { Card } from "../ui/card"
import { useSession } from "next-auth/react"

const FEATURED_DOCTOR_IMAGE = "/images/featured-doctor-female.png"

export function FeaturedDoctorCard() {
  const { data } = useDashboard()
  const { data: session } = useSession();
  const doctor = data?.featuredDoctor

  const specialty = doctor?.specialty ?? "—"

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="flex h-full w-full min-h-[400px] flex-col"

    >
      <Card
        className={"flex flex-col h-[600px] lg:flex-1 rounded-[20px] border-0 bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.05)]"}
      >
        <div className="h-full relative overflow-hidden rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.06)">
          <div className="flex flex-col h-full w-full justify-center items-center">
            <Image
              src={FEATURED_DOCTOR_IMAGE}
              alt={doctor?.name ?? ""}
              fill
              priority
              className="object-cover object-top h-full"
              sizes="(max-width: 768px) 100vw, 320px"
            />

            <span className="absolute top-3 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-white shadow-sm">
              {specialty}
            </span>

            <div className="absolute inset-x-0 bottom-0 rounded-b-[20px] bg-white/80 px-4 pb-4 pt-3 backdrop-blur-md sm:px-5 sm:pb-5 sm:pt-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h4 className="truncate text-base font-bold text-gray-800">{session?.user.name}</h4>
                <button
                  type="button"
                  aria-label="Enviar mensagem"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-md transition-transform hover:scale-105 sm:h-10 sm:w-10"
                >
                  <MessageCircle size={18} />
                </button>
              </div>

            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
