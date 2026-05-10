/**
 * Credenciais do visitante demo (portfólio). Só ativas com PORTFOLIO_DEMO_AUTH=true.
 * Pode sobrescrever com DEMO_LOGIN_EMAIL e DEMO_LOGIN_PASSWORD no .env
 */
const DEFAULT_DEMO_EMAIL = "demo@clinica.local"
const DEFAULT_DEMO_PASSWORD = "demo123456"

export function isDemoAuthEnabled() {
  return process.env.PORTFOLIO_DEMO_AUTH === "true"
}

/** Email e senha efetivos do modo demo (env ou padrão seguro só para demonstração). */
export function resolvedDemoCredentials(): { email: string; password: string } | null {
  if (!isDemoAuthEnabled()) return null

  const email = (process.env.DEMO_LOGIN_EMAIL?.trim() || DEFAULT_DEMO_EMAIL).toLowerCase()
  const password = (process.env.DEMO_LOGIN_PASSWORD ?? DEFAULT_DEMO_PASSWORD).trim()
  if (!email || !password) return null

  return { email, password }
}
