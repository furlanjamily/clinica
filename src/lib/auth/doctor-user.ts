import { hashSync } from "bcrypt"
import { db } from "@/lib/db"
import { ConflictError } from "@/lib/errors/custom-errors"
import { DEFAULT_DOCTOR_USER_PASSWORD } from "@/lib/demo-credentials"

export { DEFAULT_DOCTOR_USER_PASSWORD }
const PASSWORD_HASH_ROUNDS = 10

export type DoctorUserLogin = {
  email: string
  temporaryPassword: string
  userId: string
}

export function resolveDoctorUserEmail(doctor: {
  id: number
  name: string
  email?: string | null
}): string {
  const trimmed = doctor.email?.trim()
  if (trimmed) return trimmed.toLowerCase()
  return `medico.${doctor.id}@clinicademo.local`
}

export async function createUserForDoctor(doctor: {
  id: number
  name: string
  email?: string | null
}): Promise<DoctorUserLogin> {
  const email = resolveDoctorUserEmail(doctor)
  const existing = await db.user.findUnique({ where: { email } })

  if (existing) {
    if (existing.doctorId != null && existing.doctorId !== doctor.id) {
      throw new ConflictError("E-mail já utilizado por outro usuário.")
    }
    await db.user.update({
      where: { id: existing.id },
      data: { name: doctor.name, doctorId: doctor.id, role: "MEDICO" },
    })
    return { email, temporaryPassword: DEFAULT_DOCTOR_USER_PASSWORD, userId: existing.id }
  }

  const created = await db.user.create({
    data: {
      name: doctor.name,
      email,
      password: hashSync(DEFAULT_DOCTOR_USER_PASSWORD, PASSWORD_HASH_ROUNDS),
      role: "MEDICO",
      doctorId: doctor.id,
    },
  })

  return { email, temporaryPassword: DEFAULT_DOCTOR_USER_PASSWORD, userId: created.id }
}

export async function syncUserForDoctor(doctor: {
  id: number
  name: string
  email?: string | null
}) {
  const linked = await db.user.findFirst({ where: { doctorId: doctor.id } })
  if (!linked) {
    await createUserForDoctor(doctor)
    return
  }

  const email = resolveDoctorUserEmail(doctor)
  if (email !== linked.email.toLowerCase()) {
    const taken = await db.user.findUnique({ where: { email } })
    if (taken && taken.id !== linked.id) {
      throw new ConflictError("E-mail já utilizado por outro usuário.")
    }
  }

  await db.user.update({
    where: { id: linked.id },
    data: { name: doctor.name, email },
  })
}

export async function removeUserForDoctor(doctorId: number) {
  await db.user.deleteMany({ where: { doctorId } })
}
