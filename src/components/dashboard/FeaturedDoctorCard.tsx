"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { MessageCircle } from "lucide-react"
import { useDashboard } from "./DashboardDataProvider"
import { FeaturedDoctorCardSkeleton } from "./FeaturedDoctorCardSkeleton"
import { Card } from "../ui/card"
import { useSession } from "next-auth/react"
import { getAvatarColor } from "@/lib/avatar/colors"
import { getInitials } from "@/lib/avatar/initials"

function FeaturedDoctorPhoto({
  name,
  image,
}: {
  name: string
  image: string | null
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const showImage = Boolean(image) && !imageFailed
  const colors = getAvatarColor(name)
  const initials = getInitials(name)

  useEffect(() => {
    setImageFailed(false)
  }, [image])

  if (showImage && image) {
    return (
      <Image
        key={image}
        src={image}
        alt={name}
        fill
        priority
        className="h-full object-cover object-top"
        sizes="(max-width: 768px) 100vw, 320px"
        unoptimized={image.startsWith("/uploads/")}
        onError={() => setImageFailed(true)}
      />
    )
  }

  return (
    <div
      className="flex h-full w-full items-center justify-center text-6xl font-semibold sm:text-7xl"
      style={{ backgroundColor: colors.background, color: colors.color }}
      aria-label={name}
    >
      {initials}
    </div>
  )
}

export function FeaturedDoctorCard() {
  const { data, loading } = useDashboard()
  const { data: session } = useSession()

  const featured = data?.featuredDoctor
  const displayName = featured?.name ?? session?.user?.name ?? "Profissional"
  const specialty = featured?.specialty ?? "—"
  const image = featured?.image ?? session?.user?.image ?? null

  if (loading) {
    return <FeaturedDoctorCardSkeleton />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="flex h-full w-full min-h-[400px] flex-col"
    >
      <Card className="flex h-[600px] flex-col rounded-[20px] border-0 bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.05)] lg:flex-1">
        <div className="relative h-full overflow-hidden rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <div className="relative flex h-full w-full flex-col items-center justify-center">
            <FeaturedDoctorPhoto name={displayName} image={image} />

            <span className="absolute top-3 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-white shadow-sm">
              {specialty}
            </span>

            <div className="absolute inset-x-0 bottom-0 rounded-b-[20px] bg-white/80 px-4 pb-4 pt-3 backdrop-blur-md sm:px-5 sm:pb-5 sm:pt-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h4 className="truncate text-base font-bold text-gray-800">{displayName}</h4>
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
