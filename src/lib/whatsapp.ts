import twilio from "twilio"

type TwilioMessage = Awaited<ReturnType<ReturnType<typeof twilio>["messages"]["create"]>>

function getClient() {
  return twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  )
}

/**
 * Converte número armazenado (só dígitos, com DDD, etc.) em E.164 para Twilio (`whatsapp:+55...`).
 */
export function toWhatsAppE164(raw: string): string {
  if (!raw?.trim()) return ""
  let s = raw.trim()
  if (s.toLowerCase().startsWith("whatsapp:")) s = s.slice("whatsapp:".length)
  const digits = s.replace(/\D/g, "")
  if (!digits) return ""
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`
  if (digits.startsWith("55")) return `+${digits}`
  return `+${digits}`
}

export async function sendConfirmationWhatsApp({
  to,
  paciente,
  data,
  horario,
  profissional,
}: {
  to: string
  paciente: string
  data: string
  horario: string
  profissional: string
}): Promise<TwilioMessage> {
  const e164 = toWhatsAppE164(to)
  if (!e164) throw new Error("Telefone de destino vazio ou inválido para WhatsApp.")

  const [year, month, day] = data.split("-")
  const dataFormatada = `${day}/${month}/${year}`

  return getClient().messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM!,
    to: `whatsapp:${e164}`,
    contentSid: "HX9646bbd89582afee6c2b12ab781e6f99",
    contentVariables: JSON.stringify({ "1": paciente, "2": dataFormatada, "3": horario, "4": profissional }),
  } as any)
}

export async function sendConfirmedWhatsApp({
  to,
  paciente,
  data,
  horario,
}: {
  to: string
  paciente: string
  data: string
  horario: string
}): Promise<TwilioMessage> {
  const e164 = toWhatsAppE164(to)
  if (!e164) throw new Error("Telefone de destino vazio ou inválido para WhatsApp.")

  const [year, month, day] = data.split("-")
  const dataFormatada = `${day}/${month}/${year}`

  return getClient().messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM!,
    to: `whatsapp:${e164}`,
    contentSid: "HXa11a616c65c91fe723d55e440f2dff46",
    contentVariables: JSON.stringify({ "1": paciente, "2": dataFormatada, "3": horario }),
  } as any)
}

export async function sendCancelledWhatsApp({
  to,
  paciente,
}: {
  to: string
  paciente: string
}): Promise<TwilioMessage> {
  const e164 = toWhatsAppE164(to)
  if (!e164) throw new Error("Telefone de destino vazio ou inválido para WhatsApp.")

  return getClient().messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM!,
    to: `whatsapp:${e164}`,
    contentSid: "HX6e6f3fa19c57002d3154f8b469260549",
    contentVariables: JSON.stringify({ "1": paciente }),
  } as any)
}
