import { Resend } from "resend"

function requireEnv(name: string) {
  const v = process.env[name]?.trim()
  if (!v) throw new Error(`${name} is not set`)
  return v
}

export function getResendClient() {
  const apiKey = requireEnv("RESEND_API_KEY")
  return new Resend(apiKey)
}

export function getResendFrom() {
  return requireEnv("RESEND_FROM")
}

export function getResendReplyTo() {
  return (process.env.RESEND_REPLY_TO ?? "").trim() || undefined
}

export function getAppBaseUrl() {
  // Em produção você pode setar algo tipo https://sua-clinica.com
  return (process.env.APP_BASE_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000").trim()
}

