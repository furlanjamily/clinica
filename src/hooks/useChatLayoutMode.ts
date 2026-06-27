"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  CHAT_LAYOUT,
  MOBILE_CHAT_MQ,
  type ChatLayoutMode,
} from "@/lib/chat/layout"

type UseChatLayoutModeResult = {
  mode: ChatLayoutMode
  containerRef: (node: HTMLDivElement | null) => void
}

function resolveMode(isMobile: boolean, containerWidth: number): ChatLayoutMode {
  if (isMobile) return "mobile"
  if (containerWidth >= CHAT_LAYOUT.tripleMinContainerWidth) return "triple"
  return "dual"
}

export function useChatLayoutMode(): UseChatLayoutModeResult {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia(MOBILE_CHAT_MQ).matches
  })
  const [containerWidth, setContainerWidth] = useState(0)
  const elementRef = useRef<HTMLDivElement | null>(null)
  const observerRef = useRef<ResizeObserver | null>(null)

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect()
    observerRef.current = null
    elementRef.current = node

    if (!node) return

    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width)
    })
    observer.observe(node)
    observerRef.current = observer
    setContainerWidth(node.getBoundingClientRect().width)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_CHAT_MQ)
    const sync = () => setIsMobile(mq.matches)
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  useEffect(() => {
    return () => observerRef.current?.disconnect()
  }, [])

  const mode = resolveMode(isMobile, containerWidth)

  return { mode, containerRef }
}
