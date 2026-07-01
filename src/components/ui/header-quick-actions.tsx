"use client"

import { useState } from "react"
import { CalendarDays, MessageCircle, UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { useChatSync } from "@/hooks/useChatSync"
import { UnreadCounter } from "@/components/chat/UnreadCounter"
import { ScheduleFormModal } from "@/components/schedule/ScheduleFormModal"
import { PatientFormModal } from "@/components/patient/PatientFormModal"

type QuickAction = "schedule" | "patient" | "chat"

const ACTIONS: {
  id: QuickAction
  label: string
  icon: typeof CalendarDays
}[] = [
    { id: "schedule", label: "Agenda", icon: CalendarDays },
    { id: "patient", label: "Pacientes", icon: UserPlus },
    { id: "chat", label: "Chat", icon: MessageCircle },
  ]

function QuickActionButton({
  label,
  icon: Icon,
  onClick,
  badge,
}: {
  label: string
  icon: typeof CalendarDays
  onClick: () => void
  badge?: number
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200/90 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:bg-primary/[0.04] hover:shadow-[0_6px_18px_rgba(151,71,255,0.14)] active:translate-y-0 sm:h-11 sm:w-11 lg:h-12 lg:w-12"
    >
      <Icon
        size={17}
        strokeWidth={2}
        className="text-gray-600 transition-colors duration-200 group-hover:text-primary sm:h-[18px] sm:w-[18px]"
      />
      {badge != null && badge > 0 ? (
        <UnreadCounter
          count={badge}
          className="absolute -right-1 -top-1 h-4 min-w-4 px-1 text-[9px] leading-none shadow-sm"
        />
      ) : null}
      <span className="pointer-events-none absolute -bottom-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900/90 px-2 py-0.5 text-[10px] font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 lg:block">
        {label}
      </span>
    </button>
  )
}

export function HeaderQuickActions({ className }: { className?: string }) {
  const { canViewAgenda, canManageClinic } = useAuth()
  const { unreadCount: chatUnreadCount } = useChatSync()
  const router = useRouter()
  const [active, setActive] = useState<QuickAction | null>(null)

  const visibleActions = ACTIONS.filter(({ id }) => {
    if (id === "schedule") return canViewAgenda
    if (id === "patient") return canManageClinic
    return true
  })

  if (visibleActions.length === 0) return null

  function handleSuccess() {
    router.refresh()
  }

  return (
    <>
      <div
        className={cn(
          "flex min-w-0 items-center gap-2 rounded-full border border-gray-100/80 bg-gray-50/40 px-2 py-1.5 sm:gap-2.5 sm:px-2.5 lg:gap-3 lg:px-3",
          className
        )}
      >
        {visibleActions.map(({ id, label, icon }) => (
          <QuickActionButton
            key={id}
            label={label}
            icon={icon}
            onClick={() => {
              if (id === "chat") {
                router.push("/chat")
                return
              }
              setActive(id)
            }}
            badge={id === "chat" ? chatUnreadCount : undefined}
          />
        ))}
      </div>

      {active === "schedule" && (
        <ScheduleFormModal
          mode="create"
          onClose={() => setActive(null)}
          onSuccess={() => {
            handleSuccess()
            setActive(null)
          }}
        />
      )}

      {active === "patient" && (
        <PatientFormModal
          onClose={() => setActive(null)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  )
}
