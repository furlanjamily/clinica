export type MedicalRecord = {
  id?: number
  appointmentId: number

  patientLabel: string
  createdAt?: string

  gender?: string
  maritalStatus?: string
  birthDate?: string
  education?: string
  religion?: string
  occupation?: string
  caregiver?: string
  psychologist?: string
  clinicalDiagnosis?: string
  diagnosisReactions?: string
  emotionalState?: string
  personalHistory?: string
  psychicExam?: string
  psychologicalConduct?: string
  familyGuidance?: string

  patientDetails?: Patient
  appointment?: {
    date?: string
    slotTime?: string
    professionalName?: string | null
  }
}

export type StreetAddress = {
  zipCode?: string | null
  street?: string | null
  number?: string | null
  complement?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
}

export type Patient = {
  id: number
  name: string

  birthDate?: string | null
  gender?: string | null
  cpf?: string | null
  phone?: string | null
  email?: string | null
} & StreetAddress & {
  insurancePlan?: string | null
  insuranceNumber?: string | null
  notes?: string | null
  maritalStatus?: string | null
  education?: string | null
  religion?: string | null
  profession?: string | null
}

export type Doctor = {
  id: number
  name: string
  crm: string
  specialty: string

  phone?: string | null
  email?: string | null
  cpf?: string | null
  birthDate?: string | null
  gender?: string | null
  shift?: string | null
  notes?: string | null

  active: boolean
} & StreetAddress
