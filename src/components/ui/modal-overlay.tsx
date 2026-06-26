"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

type ModalOverlayProps = React.PropsWithChildren<{
  className?: string
}>

type ViewportTier = "phone" | "tablet" | "desktop"

type ModalLayoutState = {
  expanded: boolean
  tier: ViewportTier
}

type ModalLayoutContextValue = {
  registerLayout: (state: ModalLayoutState) => void
}

const ModalLayoutContext = createContext<ModalLayoutContextValue | null>(null)

const defaultLayoutState: ModalLayoutState = {
  expanded: false,
  tier: "desktop",
}

function getViewportTier(): ViewportTier {
  if (typeof window === "undefined") return "desktop"
  const width = window.innerWidth
  if (width < 640) return "phone"
  if (width < 1024) return "tablet"
  return "desktop"
}

function useViewportTier() {
  const [tier, setTier] = useState<ViewportTier>(() => getViewportTier())

  useEffect(() => {
    const update = () => setTier(getViewportTier())
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  return tier
}

function useLockBackgroundScroll() {
  useEffect(() => {
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
  }, [])
}

function getCompactMaxHeight(tier: ViewportTier) {
  const viewportHeight = window.visualViewport?.height ?? window.innerHeight
  const inset = tier === "tablet" ? 32 : 0
  return viewportHeight * 0.88 - inset
}

type ModalPanelProps = React.PropsWithChildren<{
  className?: string
  size?: "sm" | "md" | "lg"
}>

const modalPanelWidths = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
} as const

const modalPanelDesktopSizes = {
  sm: "lg:max-w-sm lg:max-h-[min(92vh,32rem)]",
  md: "lg:max-w-md lg:max-h-[min(92vh,40rem)]",
  lg: "lg:max-w-2xl lg:max-h-[min(92vh,44rem)]",
} as const

export function ModalPanel({ children, className, size = "md" }: ModalPanelProps) {
  const layout = useContext(ModalLayoutContext)
  const scrollRef = useRef<HTMLDivElement>(null)
  const tier = useViewportTier()
  const [expanded, setExpanded] = useState(false)

  const registerLayout = layout?.registerLayout

  useLayoutEffect(() => {
    registerLayout?.({ expanded, tier })
    return () => registerLayout?.(defaultLayoutState)
  }, [expanded, tier, registerLayout])

  useLayoutEffect(() => {
    if (tier === "desktop") {
      setExpanded((prev) => (prev ? false : prev))
      return
    }

    const el = scrollRef.current
    if (!el) return

    const check = () => {
      const limit = getCompactMaxHeight(tier)
      const height = el.scrollHeight
      setExpanded((prev) => {
        if (height > limit) return true
        // Evita alternar expandido/compacto quando a altura fica no limite
        if (prev && height > limit - 64) return true
        return false
      })
    }

    check()

    const ro = new ResizeObserver(check)
    ro.observe(el)
    window.visualViewport?.addEventListener("resize", check)
    window.addEventListener("resize", check)

    return () => {
      ro.disconnect()
      window.visualViewport?.removeEventListener("resize", check)
      window.removeEventListener("resize", check)
    }
  }, [tier, children])

  const isPhoneExpanded = tier === "phone" && expanded
  const isTabletExpanded = tier === "tablet" && expanded
  const isCompact = tier !== "desktop" && !expanded

  return (
    <div
      className={cn(
        "flex w-full min-h-0 flex-col overflow-hidden bg-white",
        isPhoneExpanded && [
          "h-dvh max-h-dvh rounded-none shadow-none",
          "pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]",
        ],
        isTabletExpanded && "h-full max-h-full flex-1 rounded-xl shadow-lg",
        isCompact &&
          tier === "phone" &&
          "max-h-[88dvh] rounded-t-2xl shadow-lg",
        isCompact &&
          tier === "tablet" &&
          cn("max-h-[88dvh] rounded-xl shadow-lg", modalPanelWidths[size]),
        "lg:h-auto lg:rounded-xl lg:shadow-lg lg:pt-0 lg:pb-0",
        modalPanelDesktopSizes[size],
        className
      )}
    >
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 [scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch] lg:p-6"
      >
        {children}
      </div>
    </div>
  )
}

export function ModalOverlay({ children, className }: ModalOverlayProps) {
  useLockBackgroundScroll()
  const [layoutState, setLayoutState] = useState<ModalLayoutState>(defaultLayoutState)

  const registerLayout = useCallback((state: ModalLayoutState) => {
    setLayoutState((prev) =>
      prev.expanded === state.expanded && prev.tier === state.tier ? prev : state
    )
  }, [])

  const contextValue = useMemo(
    () => ({ registerLayout }),
    [registerLayout]
  )

  const { expanded, tier } = layoutState
  const isPhoneExpanded = expanded && tier === "phone"
  const isTabletExpanded = expanded && tier === "tablet"

  if (typeof document === "undefined") return null

  return createPortal(
    <ModalLayoutContext.Provider value={contextValue}>
      <div
        className={cn(
          "fixed inset-0 z-[100] flex justify-center overflow-hidden bg-black/40 backdrop-blur-sm",
          isPhoneExpanded && "items-stretch p-0",
          isTabletExpanded && "items-stretch p-3",
          !expanded && "items-end p-0 lg:items-center lg:p-4",
          tier === "tablet" && !expanded && "items-center p-3",
          className
        )}
      >
        {children}
      </div>
    </ModalLayoutContext.Provider>,
    document.body
  )
}
