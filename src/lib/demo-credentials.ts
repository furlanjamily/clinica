/** Conta principal de demonstração — único SUPER_ADMIN do seed. */
export const DEMO_SUPER_ADMIN_EMAIL = "demo@clinica.local"

export const DEFAULT_DEMO_PASSWORD = "demo123456"

export const DEFAULT_DOCTOR_USER_PASSWORD = "Medico123!"

export function resolvedDemoSuperAdminEmail(): string {
  return (process.env.DEMO_LOGIN_EMAIL?.trim() || DEMO_SUPER_ADMIN_EMAIL).toLowerCase()
}

export function resolvedDemoSuperAdminPassword(): string {
  return process.env.DEMO_LOGIN_PASSWORD?.trim() || DEFAULT_DEMO_PASSWORD
}

export function isDemoSuperAdminEmail(email: string): boolean {
  return email.trim().toLowerCase() === resolvedDemoSuperAdminEmail()
}
