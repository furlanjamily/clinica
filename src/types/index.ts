export type MedicalRecord = {
  id?: number
  agendamentoId: number

  patient: string
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

  paciente?: Patient
  agendamento?: {
    data?: string
    horario?: string
    profissionalNome?: string | null
  }
}

export type StreetAddress = {
  cep?: string | null
  logradouro?: string | null
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  cidade?: string | null
  uf?: string | null
}

export type Patient = {
  id: number
  nome: string

  dataNascimento?: string | null
  sexo?: string | null
  cpf?: string | null
  telefone?: string | null
  email?: string | null
} & StreetAddress & {
  convenio?: string | null
  numeroConvenio?: string | null
  observacoes?: string | null
  estadoCivil?: string | null
  escolaridade?: string | null
  religiao?: string | null
  profissao?: string | null
}

export type Doctor = {
  id: number
  nome: string
  crm: string
  especialidade: string

  telefone?: string | null
  email?: string | null
  cpf?: string | null
  dataNascimento?: string | null
  sexo?: string | null
  turno?: string | null
  observacoes?: string | null

  ativo: boolean
} & StreetAddress