import type { Session } from "next-auth"
import { db } from "@/lib/db"

export function normalizeProfessionalName(value: string): string {
  return value.toLowerCase().replace(/[\s.]/g, "")
}

export function professionalNamesMatch(a: string, b: string): boolean {
  const na = normalizeProfessionalName(a)
  const nb = normalizeProfessionalName(b)
  return na.length > 0 && (na === nb || na.includes(nb) || nb.includes(na))
}

export function sessionProfessionalLabel(session: Session): string | null {
  return session.user.username ?? session.user.name ?? null
}

export async function resolveDoctorForSession(session: Session) {
  const label = sessionProfessionalLabel(session)
  if (!label) return null

  const doctors = await db.doctor.findMany({
    where: { deletedAt: null, active: true },
    select: { id: true, name: true },
  })

  return doctors.find((d) => professionalNamesMatch(d.name, label)) ?? null
}
