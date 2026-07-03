import type { Patient as PrismaPatient, Sex } from "@/generated/prisma/client"
import { dateOnlyToString, localDateOnly } from "@/lib/datetime/appointment-time"

/** Vocabulário canônico de sexo exposto na API (igual aos selects da UI). */
const SEX_VALUES: Sex[] = ["Masculino", "Feminino", "Outro"]

/** Normaliza valores de entrada (inclui tolerância a dados legados "M"/"F"). */
export function parseSex(value: string | null | undefined): Sex | null {
  if (value == null) return null
  const v = value.trim()
  if (v === "") return null
  if ((SEX_VALUES as string[]).includes(v)) return v as Sex
  if (v.toUpperCase() === "M") return "Masculino"
  if (v.toUpperCase() === "F") return "Feminino"
  return "Outro"
}

export type PatientDTO = {
  id: number
  name: string
  birthDate: string | null
  gender: string | null
  cpf: string | null
  phone: string | null
  email: string | null
  zipCode: string | null
  street: string | null
  number: string | null
  complement: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  insurancePlan: string | null
  insuranceNumber: string | null
  notes: string | null
  maritalStatus: string | null
  education: string | null
  religion: string | null
  profession: string | null
  image: string | null
}

/** Banco -> contrato da UI (sex -> gender, Date -> "YYYY-MM-DD"). */
export function toPatientDTO(p: PrismaPatient): PatientDTO {
  return {
    id: p.id,
    name: p.name,
    birthDate: dateOnlyToString(p.birthDate),
    gender: p.sex ?? null,
    cpf: p.cpf,
    phone: p.phone,
    email: p.email,
    zipCode: p.zipCode,
    street: p.street,
    number: p.number,
    complement: p.complement,
    neighborhood: p.neighborhood,
    city: p.city,
    state: p.state,
    insurancePlan: p.insurancePlan,
    insuranceNumber: p.insuranceNumber,
    notes: p.notes,
    maritalStatus: p.maritalStatus,
    education: p.education,
    religion: p.religion,
    profession: p.profession,
    image: p.image,
  }
}

type PatientInput = {
  name?: string
  birthDate?: string | null
  gender?: string | null
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
  insurancePlan?: string | null
  insuranceNumber?: string | null
  notes?: string | null
  maritalStatus?: string | null
  education?: string | null
  religion?: string | null
  profession?: string | null
}

/** Contrato da UI -> banco (gender -> sex, "YYYY-MM-DD" -> Date). */
export function patientInputToDb(input: PatientInput) {
  const { gender, birthDate, ...rest } = input
  return {
    ...rest,
    ...(gender !== undefined ? { sex: parseSex(gender) } : {}),
    ...(birthDate !== undefined
      ? { birthDate: birthDate ? localDateOnly(birthDate) : null }
      : {}),
  }
}
