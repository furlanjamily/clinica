import type { Doctor as PrismaDoctor, Prisma } from "@/generated/prisma/client"
import { dateOnlyToString, localDateOnly } from "@/lib/datetime/appointment-time"
import { parseSex } from "@/lib/domain/patient-dto"

export type DoctorDTO = {
  id: number
  name: string
  crm: string
  specialty: string
  shift: string | null
  gender: string | null
  cpf: string | null
  birthDate: string | null
  phone: string | null
  email: string | null
  zipCode: string | null
  street: string | null
  number: string | null
  complement: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  notes: string | null
  active: boolean
  linkedUser?: { id: string; image: string | null } | null
}

export type DoctorWithSpecialty = PrismaDoctor & {
  specialty?: { name: string } | null
  users?: { id: string; image: string | null }[]
}

/** Banco -> contrato da UI (specialty relation -> string, sex -> gender). */
export function toDoctorDTO(d: DoctorWithSpecialty): DoctorDTO {
  const linked = d.users?.[0] ?? null
  return {
    id: d.id,
    name: d.name,
    crm: d.crm ?? "",
    specialty: d.specialty?.name ?? "",
    shift: d.shift,
    gender: d.sex ?? null,
    cpf: d.cpf,
    birthDate: dateOnlyToString(d.birthDate),
    phone: d.phone,
    email: d.email,
    zipCode: d.zipCode,
    street: d.street,
    number: d.number,
    complement: d.complement,
    neighborhood: d.neighborhood,
    city: d.city,
    state: d.state,
    notes: d.notes,
    active: d.active,
    linkedUser: linked ? { id: linked.id, image: linked.image ?? null } : null,
  }
}

type DoctorInput = {
  name?: string
  crm?: string | null
  specialty?: string | null
  shift?: string | null
  gender?: string | null
  birthDate?: string | null
  cpf?: string | null
  phone?: string | null
  email?: string | null
  zipCode?: string | null
  street?: string | null
  number?: string | null
  complement?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  notes?: string | null
  active?: boolean
}

/**
 * Contrato da UI -> banco. A especialidade (texto livre) é normalizada na
 * tabela `specialties` via `connectOrCreate`, habilitando agregações confiáveis
 * de "distribuição por especialidade" sem mudar a UI.
 */
export function doctorInputToDb(input: DoctorInput): Prisma.DoctorUpdateInput {
  const { gender, birthDate, specialty, ...rest } = input
  const data: Prisma.DoctorUpdateInput = { ...rest }

  if (gender !== undefined) data.sex = parseSex(gender)
  if (birthDate !== undefined) {
    data.birthDate = birthDate ? localDateOnly(birthDate) : null
  }
  if (specialty !== undefined) {
    const name = specialty?.trim()
    data.specialty = name
      ? { connectOrCreate: { where: { name }, create: { name } } }
      : { disconnect: true }
  }

  return data
}
