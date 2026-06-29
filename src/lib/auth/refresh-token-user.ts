import { db } from "@/lib/db"
import type { UserRoleType } from "@/types/auth"

export type TokenUserSnapshot = {
  id: string
  username: string | null
  role: UserRoleType | null
  doctorId: number | null
  image: string | null
}

export async function loadTokenUserSnapshot(userId: string): Promise<TokenUserSnapshot | null> {
  if (!userId || userId === "portfolio-demo") return null

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      role: true,
      doctorId: true,
      image: true,
      active: true,
    },
  })

  if (!user?.active) return null

  return {
    id: user.id,
    username: user.name,
    role: (user.role as UserRoleType | null) ?? null,
    doctorId: user.doctorId,
    image: user.image ?? null,
  }
}

export function applyTokenUserSnapshot(
  token: Record<string, unknown>,
  snapshot: TokenUserSnapshot
): void {
  token.id = snapshot.id
  token.username = snapshot.username
  token.role = snapshot.role
  token.doctorId = snapshot.doctorId
  token.image = snapshot.image
}
