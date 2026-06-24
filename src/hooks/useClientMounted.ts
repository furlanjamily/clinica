"use client"

import { useEffect, useState } from "react"

/** Evita mismatch de hidratação em conteúdo que depende de data/locale do browser. */
export function useClientMounted() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return mounted
}
