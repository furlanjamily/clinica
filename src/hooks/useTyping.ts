"use client"

import { useCallback, useRef } from "react"
import { setTypingApi } from "./chat-api"

const TYPING_DEBOUNCE_MS = 2000

export function useTyping(conversationId: number | null) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTypingRef = useRef(false)

  const stopTyping = useCallback(() => {
    if (!conversationId || !isTypingRef.current) return
    isTypingRef.current = false
    void setTypingApi(conversationId, false)
  }, [conversationId])

  const startTyping = useCallback(() => {
    if (!conversationId) return

    if (!isTypingRef.current) {
      isTypingRef.current = true
      void setTypingApi(conversationId, true)
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(stopTyping, TYPING_DEBOUNCE_MS)
  }, [conversationId, stopTyping])

  return { startTyping, stopTyping }
}
