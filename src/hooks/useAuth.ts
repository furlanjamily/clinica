"use client"

import { useSession } from "next-auth/react"
import {
  canCreateAppointment,
  canManageClinic,
  canManageUsers,
  canViewAgenda,
  canViewAttendance,
  canViewDashboard,
} from "@/lib/auth/permissions"
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
    canManageUsers: canManageUsers(role),
    canManageClinic: canManageClinic(role),
    canViewDashboard: canViewDashboard(role),
    canViewAgenda: canViewAgenda(role),
    canViewAttendance: canViewAttendance(role),
    canCreateAppointment: canCreateAppointment(role),
    /** @deprecated Use canViewAgenda ou canManageClinic conforme o contexto */
    canViewSchedule: canManageClinic(role),
  }
}
