import type { Session } from "next-auth"
import type { Prisma } from "@/generated/prisma/client"
import { resolveDoctorForSession } from "@/lib/auth/session-doctor"
import type { UserRoleType } from "@/types/auth"
import { UserRole } from "@/types/auth"

const UNRESTRICTED_ROLES: UserRoleType[] = [UserRole.SuperAdmin, UserRole.Admin]

/**
 * Retorna `undefined` quando o usuário vê todos os agendamentos.
 * Retorna `doctorId` (ou `-1` se não houver médico vinculado) para perfis restritos.
 * Usuários vinculados a um médico sempre veem só a própria agenda, mesmo como admin.
 */
export async function resolveAppointmentDoctorFilter(
  session: Session
): Promise<number | undefined> {
  const doctor = await resolveDoctorForSession(session)
  if (doctor) return doctor.id

  const role = session.user.role as UserRoleType | null | undefined
  if (role && UNRESTRICTED_ROLES.includes(role)) return undefined

  return -1
}

export function appointmentDoctorWhere(
  doctorFilter: number | undefined
): Pick<Prisma.AppointmentWhereInput, "doctorId"> {
  if (doctorFilter === undefined) return {}
  return { doctorId: doctorFilter }
}

export function transactionDoctorWhere(
  doctorFilter: number | undefined
): Pick<Prisma.TransactionWhereInput, "appointment"> {
  if (doctorFilter === undefined) return {}
  return { appointment: { doctorId: doctorFilter } }
}

export function medicalRecordDoctorWhere(
  doctorFilter: number | undefined
): Pick<Prisma.MedicalRecordWhereInput, "appointment"> {
  if (doctorFilter === undefined) return {}
  return { appointment: { doctorId: doctorFilter } }
}

export function patientDoctorWhere(
  doctorFilter: number | undefined
): Pick<Prisma.PatientWhereInput, "appointments"> {
  if (doctorFilter === undefined) return {}
  return { appointments: { some: { doctorId: doctorFilter, deletedAt: null } } }
}
