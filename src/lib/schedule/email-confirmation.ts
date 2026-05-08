import crypto from "crypto"
import { db } from "@/lib/db"
import { ValidationError, NotFoundError } from "@/lib/errors/custom-errors"

const TOKEN_BYTES = 32
const DEFAULT_TTL_MINUTES = 60 * 24 // 24h

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export function generateToken() {
  return crypto.randomBytes(TOKEN_BYTES).toString("hex")
}

export function getExpiresAt() {
  const ttlMinutes = Number(process.env.EMAIL_CONFIRMATION_TTL_MINUTES ?? DEFAULT_TTL_MINUTES)
  const ms = Math.max(5, ttlMinutes) * 60_000
  return new Date(Date.now() + ms)
}

export async function createOrRefreshConfirmationToken(params: {
  agendamentoId: number
  sentToEmail?: string | null
}) {
  const token = generateToken()
  const tokenHash = hashToken(token)
  const expiresAt = getExpiresAt()

  const row = await db.confirmacaoAgendamentoEmail.upsert({
    where: { agendamentoId: params.agendamentoId },
    create: {
      agendamentoId: params.agendamentoId,
      tokenHash,
      expiresAt,
      sentToEmail: params.sentToEmail ?? undefined,
    },
    update: {
      tokenHash,
      expiresAt,
      usedAt: null,
      sentToEmail: params.sentToEmail ?? undefined,
    },
  })

  return { token, tokenHash, expiresAt, row }
}

export async function consumeConfirmationTokenOrThrow(token: string) {
  const tokenHash = hashToken(token)
  const row = await db.confirmacaoAgendamentoEmail.findUnique({
    where: { tokenHash },
    include: { agendamento: { include: { paciente: true, medico: true } } },
  })

  if (!row) throw new NotFoundError("Token inválido")
  if (row.usedAt) throw new ValidationError("Token já utilizado")
  if (row.expiresAt.getTime() < Date.now()) throw new ValidationError("Token expirado")

  const updated = await db.confirmacaoAgendamentoEmail.update({
    where: { id: row.id },
    data: { usedAt: new Date() },
  })

  return { row: { ...row, usedAt: updated.usedAt } }
}

