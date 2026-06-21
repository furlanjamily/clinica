"use client"

import { createContext, useContext } from "react"

type AdminShellContextValue = {
  openMobileMenu: () => void
}

export const AdminShellContext = createContext<AdminShellContextValue | null>(null)

export function useAdminShell() {
  return useContext(AdminShellContext)
}
