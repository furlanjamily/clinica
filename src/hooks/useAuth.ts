"use client"

import { useSession } from "next-auth/react"
import { UserRole, type UserRoleType } from "@/types/auth"

export function useAuth() {
  const { data: session, status } = useSession()
  const role = (session?.user as { role?: string } | undefined)?.role as UserRoleType | undefined

  return {
    session,
    status,
    role,
    isAuthenticated: status === "authenticated",
    isSuperAdmin: role === UserRole.SuperAdmin,
    isAdmin: role === UserRole.Admin,
    isMedico: role === UserRole.Medico,
    canManageUsers: role === UserRole.SuperAdmin || role === UserRole.Admin,
    canViewSchedule: role !== UserRole.Medico,
  }
}
