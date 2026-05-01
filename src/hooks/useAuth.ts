"use client"

import { useSession } from "next-auth/react"
import type { UserRoleType } from "@/types/auth"

export function useAuth() {
  const { data: session, status } = useSession()
  const role = (session?.user as { role?: string } | undefined)?.role as UserRoleType | undefined

  return {
    session,
    status,
    role,
    isAuthenticated: status === "authenticated",
    isSuperAdmin: role === "SUPER_ADMIN",
    isAdmin: role === "ADMIN",
    isMedico: role === "MEDICO",
    canViewSchedule: role !== "MEDICO",
  }
}
