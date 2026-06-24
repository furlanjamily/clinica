export const UserRole = {
  SuperAdmin: "SUPER_ADMIN",
  Admin: "ADMIN",
  Medico: "MEDICO",
} as const

export const USER_ROLES = [
  UserRole.SuperAdmin,
  UserRole.Admin,
  UserRole.Medico,
] as const

export type UserRoleType = (typeof USER_ROLES)[number]

export type AppUserType = {
  id: string
  name: string
  role: UserRoleType
}
