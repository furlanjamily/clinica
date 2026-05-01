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
    profissionalNome?: string
  }
}

export type Patient = {
  id: number
  nome: string

  dataNascimento?: string | null
  sexo?: string | null
  cpf?: string | null
  telefone?: string | null
  email?: string | null
  endereco?: string | null
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
  endereco?: string | null
  turno?: string | null
  observacoes?: string | null

  ativo: boolean
}