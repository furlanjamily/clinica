import { UserRole, type UserRoleType } from "@/types/auth"

export function canViewDashboard(role: UserRoleType | null | undefined) {
  return role === UserRole.SuperAdmin || role === UserRole.Medico
}

export function canViewAgenda(role: UserRoleType | null | undefined) {
  return role === UserRole.SuperAdmin || role === UserRole.Medico
}

export function canViewAttendance(role: UserRoleType | null | undefined) {
  return role === UserRole.SuperAdmin || role === UserRole.Medico
}

export function canManageClinic(role: UserRoleType | null | undefined) {
  return role === UserRole.SuperAdmin || role === UserRole.Admin
}

export function canManageUsers(role: UserRoleType | null | undefined) {
  return role === UserRole.SuperAdmin || role === UserRole.Admin
}

export function canCreateAppointment(role: UserRoleType | null | undefined) {
  return role === UserRole.SuperAdmin || role === UserRole.Medico
}

export function getDefaultRouteForRole(role: UserRoleType | null | undefined) {
  if (role === UserRole.Admin) return "/finance"
  return "/dashboard"
}

const ADMIN_FORBIDDEN_PREFIXES = ["/dashboard", "/schedule", "/attendance"] as const

export function isRouteForbiddenForRole(
  pathname: string,
  role: UserRoleType | null | undefined
) {
  if (role !== UserRole.Admin) return false
  return ADMIN_FORBIDDEN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}
