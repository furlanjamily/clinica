export const USER_ROLES = ["SUPER_ADMIN", "ADMIN", "MEDICO"] as const
export type UserRoleType = (typeof USER_ROLES)[number]

export type AppUserType = {
  id: string
  name: string
  role: UserRoleType
}
