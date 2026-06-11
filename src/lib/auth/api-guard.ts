import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ForbiddenError, UnauthorizedError } from "@/lib/errors/custom-errors"
import type { UserRoleType } from "@/types/auth"

/**
 * Garante que a requisição possui uma sessão autenticada.
 * Lança `UnauthorizedError` (tratado por `handleApiError`) caso contrário.
 */
export async function requireSession() {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new UnauthorizedError()
  return session
}

/**
 * Garante sessão autenticada com um dos papéis informados.
 * Lança `ForbiddenError` quando o usuário não tem permissão.
 */
export async function requireRole(...roles: UserRoleType[]) {
  const session = await requireSession()
  const role = session.user.role
  if (!role || !roles.includes(role)) throw new ForbiddenError()
  return session
}
