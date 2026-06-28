/**
 * Credenciais do visitante demo (portfólio). Só ativas com PORTFOLIO_DEMO_AUTH=true.
 * Pode sobrescrever com DEMO_LOGIN_EMAIL e DEMO_LOGIN_PASSWORD no .env
 */
import {
  resolvedDemoSuperAdminEmail,
  resolvedDemoSuperAdminPassword,
} from "./demo-credentials"

export {
  DEFAULT_DEMO_PASSWORD,
  DEMO_SUPER_ADMIN_EMAIL,
  isDemoSuperAdminEmail,
  resolvedDemoSuperAdminEmail,
  resolvedDemoSuperAdminPassword,
} from "./demo-credentials"

export function isDemoAuthEnabled() {
  return process.env.PORTFOLIO_DEMO_AUTH === "true"
}

/** Email e senha efetivos do modo demo (env ou padrão seguro só para demonstração). */
export function resolvedDemoCredentials(): { email: string; password: string } | null {
  if (!isDemoAuthEnabled()) return null

  const email = resolvedDemoSuperAdminEmail()
  const password = resolvedDemoSuperAdminPassword()
  if (!email || !password) return null

  return { email, password }
}
