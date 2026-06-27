"use client"

import { useEffect } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { CHAT_LAYOUT } from "@/lib/chat/layout"
import type { ChatAttachmentDTO } from "@/lib/chat/types"
import { ChatCard } from "./ChatCard"
import { RightSidebar } from "./RightSidebar"
import { RightSidebarSkeleton } from "./skeletons/ChatLayoutSkeleton"

type Props = {
  open: boolean
  onClose: () => void
  attachments: ChatAttachmentDTO[]
  isLoading?: boolean
  layout?: "mobile" | "dual"
}

const drawerTransition = {
  type: "tween" as const,
  duration: 0.28,
  ease: [0.32, 0.72, 0, 1] as [number, number, number, number],
}

function useLockBackgroundScroll(open: boolean) {
  useEffect(() => {
    if (!open) return

    const html = document.documentElement
    const body = document.body
    const adminScroll = document.querySelector(
      "main .overflow-y-auto"
    ) as HTMLElement | null

    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = body.style.overflow
    const prevAdminOverflow = adminScroll?.style.overflow ?? ""

    html.style.overflow = "hidden"
    body.style.overflow = "hidden"
    if (adminScroll) adminScroll.style.overflow = "hidden"

    return () => {
      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
      if (adminScroll) adminScroll.style.overflow = prevAdminOverflow
    }
  }, [open])
}

export function FilesDrawer({
  open,
  onClose,
  attachments,
  isLoading = false,
  layout = "dual",
}: Props) {
  useLockBackgroundScroll(open)

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, onClose])

  if (typeof document === "undefined") return null

  const isMobile = layout === "mobile"

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="files-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "fixed inset-0 z-[100] flex overflow-hidden bg-black/40 backdrop-blur-sm",
            isMobile ? "flex-col p-3 sm:p-4" : "justify-end"
          )}
          role="presentation"
        >
          <button
            type="button"
            aria-label="Fechar arquivos"
            className="absolute inset-0"
            onClick={onClose}
          />

          <motion.div
            initial={isMobile ? { y: "100%" } : { x: "100%" }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: "100%" } : { x: "100%" }}
            transition={drawerTransition}
            className={cn(
              "relative z-10 flex min-h-0 flex-col overflow-hidden bg-white shadow-lg",
              isMobile
                ? "h-full w-full rounded-2xl"
                : "h-full shadow-xl"
            )}
            style={isMobile ? undefined : { width: CHAT_LAYOUT.columns.files }}
            onClick={(event) => event.stopPropagation()}
          >
            <ChatCard className="relative h-full w-full rounded-none border-0 shadow-none">
              <button
                type="button"
                aria-label="Fechar"
                onClick={onClose}
                className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-secondary shadow-sm transition hover:bg-white hover:text-gray-900"
              >
                <X size={18} />
              </button>
              {isLoading ? (
                <RightSidebarSkeleton />
              ) : (
                <RightSidebar attachments={attachments} />
              )}
            </ChatCard>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  )
}
