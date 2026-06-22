// Seed de dados fictícios; preserva tabelas NextAuth.
import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { hashSync } from "bcrypt"
import { addDays, format } from "date-fns"
import { PrismaClient } from "../src/generated/prisma/client"
import { DESPESA_CATEGORIAS, RECEITA_CATEGORIAS } from "../src/lib/finance/categories"
import {
  combineLocalDateTime,
  localDateOnly,
  dateOnlyToString,
} from "../src/lib/datetime/appointment-time"
import { AppointmentStatus } from "../src/lib/schedule/status"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não definido. Configure o .env antes de rodar o seed.")
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

const TODAY = new Date()

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00",
]

const PAYMENT_METHODS = ["Pix", "Cartão de Crédito", "Cartão de Débito", "Dinheiro", "Convênio"]

const DEFAULT_DOCTOR_PASSWORD = "Medico123!"

type SeedSex = "Masculino" | "Feminino" | "Outro"

const DOCTOR_SEED: Array<{
  name: string
  crm: string
  specialty: string
  sex: SeedSex
  shift: string
}> = [
  { name: "Dr.Teste", crm: "CRM-SP 000001", specialty: "Psiquiatria", sex: "Masculino", shift: "Integral" },
  { name: "Dra. Helena Martins", crm: "CRM-SP 123456", specialty: "Psiquiatria", sex: "Feminino", shift: "Integral" },
  { name: "Dr. Ricardo Alves", crm: "CRM-SP 234567", specialty: "Psicologia clínica", sex: "Masculino", shift: "Tarde" },
  { name: "Dra. Julia Costa", crm: "CRM-RJ 345678", specialty: "Neurologia", sex: "Feminino", shift: "Manhã" },
  { name: "Dr. Fernando Dias", crm: "CRM-SP 456789", specialty: "Psiquiatria infantil", sex: "Masculino", shift: "Integral" },
  { name: "Dra. Camila Rocha", crm: "CRM-MG 567890", specialty: "Psicologia hospitalar", sex: "Feminino", shift: "Integral" },
  { name: "Dr. Bruno Silveira", crm: "CRM-SP 678901", specialty: "Clínica médica", sex: "Masculino", shift: "Manhã" },
  { name: "Dra. Paula Nogueira", crm: "CRM-SP 789012", specialty: "Terapia cognitivo-comportamental", sex: "Feminino", shift: "Tarde" },
  { name: "Dr. Marcos Teixeira", crm: "CRM-BA 890123", specialty: "Psiquiatria", sex: "Masculino", shift: "Integral" },
  { name: "Dra. Larissa Freitas", crm: "CRM-SP 901234", specialty: "Psicologia do trabalho", sex: "Feminino", shift: "Manhã" },
  { name: "Dr. André Cardoso", crm: "CRM-SP 012345", specialty: "Psiquiatria geriátrica", sex: "Masculino", shift: "Tarde" },
]

const PATIENT_NAMES = [
  "Ana Beatriz Souza", "Carlos Eduardo Lima", "Mariana Oliveira", "Pedro Henrique Ramos",
  "Letícia Ferreira", "Gabriel Martins", "Fernanda Ribeiro", "Lucas Andrade",
  "Amanda Costa", "Rafael Moura", "Juliana Pereira", "Felipe Barbosa",
  "Beatriz Gomes", "Thiago Nunes", "Camila Duarte", "Rodrigo Castro",
  "Patricia Mendes", "Vinicius Lopes", "Daniela Azevedo", "Gustavo Reis",
  "Renata Carvalho", "Bruno Teixeira", "Larissa Monteiro", "Henrique Dias",
  "Vanessa Correia", "Mateus Pinto", "Bianca Rocha", "Caio Moreira",
  "Priscila Santos", "Leonardo Freitas", "Simone Almeida", "Diego Campos",
  "Claudia Vieira", "André Luiz Torres", "Fabiana Brito", "Igor Machado",
  "Tatiane Peixoto", "Marcelo Farias", "Renan Cardoso", "Adriana Macedo",
  "Paulo Sérgio Nunes", "Michele Antunes", "Eduardo Gonçalves", "Carla Regina Silva",
  "Rogério Bastos", "Silvia Helena Cruz", "Otávio Mendonça",
  "Helena Prado", "Márcio Viana", "Eliane Duque", "Sérgio Matos",
  "Luciana Barros", "Fábio Cunha", "Aline Tavares", "Roberto Siqueira",
  "Cristiane Lacerda", "Jorge Pinheiro", "Natália Borges", "Alexandre Paiva",
  "Monique Furtado", "Ricardo Amorim", "Tânia Mello", "Wesley Brandão",
  "Karina Holanda", "Douglas Pacheco", "Isabela Nascimento", "Leandro Cavalcante",
]

const CITY_STATE_SAMPLES = [
  { city: "São Paulo", state: "SP" },
  { city: "Campinas", state: "SP" },
  { city: "Santos", state: "SP" },
  { city: "Rio de Janeiro", state: "RJ" },
  { city: "Belo Horizonte", state: "MG" },
]

const INSURANCE_PLANS = ["Unimed", "Amil", "Bradesco Saúde", "Particular", null] as const

function padCpf(i: number): string {
  const nine = String(100000000 + i).padStart(9, "0")
  const dv = String(i % 100).padStart(2, "0")
  return `${nine}${dv}`
}

function demoPhone(i: number): string {
  const ddd = 11 + (i % 8)
  const parte = String(970000000 + (i * 137) % 29999999).padStart(9, "0")
  return `(${ddd}) ${parte.slice(0, 5)}-${parte.slice(5)}`
}

function parseSlotTime(slotTime: string): [number, number] {
  const [h, min] = slotTime.split(":").map(Number)
  return [h, min]
}

type StatusPipeline =
  | "future_agendado"
  | "future_aguardando"
  | "future_confirmado"
  | "past_cancelado"
  | "past_concluido_consulta"
  | "past_concluido_retorno"
  | "today_confirmado"
  | "today_registrar"
  | "today_pago"
  | "today_em_atendimento"
  | "today_agendado"

function pickPipeline(dateStr: string, seed: number): StatusPipeline {
  const todayStr = format(TODAY, "yyyy-MM-dd")
  if (dateStr > todayStr) {
    const r = seed % 3
    if (r === 0) return "future_confirmado"
    if (r === 1) return "future_aguardando"
    return "future_agendado"
  }
  if (dateStr < todayStr) {
    const r = seed % 10
    if (r === 0 || r === 1) return "past_cancelado"
    if (r === 2) return "past_concluido_retorno"
    return "past_concluido_consulta"
  }
  const r = seed % 8
  const order: StatusPipeline[] = [
    "today_agendado",
    "today_confirmado",
    "today_registrar",
    "today_pago",
    "today_em_atendimento",
    "today_confirmado",
    "today_agendado",
    "today_pago",
  ]
  return order[r]
}

const usedSlots = new Set<string>()
function slotKey(doctorId: number, dateStr: string, slotTime: string) {
  return `${doctorId}|${dateStr}|${slotTime}`
}

function allocateSlotTime(doctorId: number, dateStr: string, startIdx: number): string | null {
  for (let step = 0; step < TIME_SLOTS.length; step++) {
    const idx = (startIdx + step) % TIME_SLOTS.length
    const h = TIME_SLOTS[idx]
    const k = slotKey(doctorId, dateStr, h)
    if (!usedSlots.has(k)) {
      usedSlots.add(k)
      return h
    }
  }
  return null
}

function feeAmountWithVariance(base: number): number {
  const min = Math.max(base * 0.85, 1)
  const max = base * 1.15
  const mid = (min + max) / 2
  return Math.round(mid * 100) / 100
}

const CLINICAL_VARIANTS = [
  {
    clinicalDiagnosis:
      "Transtorno de ansiedade generalizada (CID F41.1). Sintomas há 8 meses, com impacto em sono e concentração.",
    diagnosisReactions:
      "Aceitação do quadro; motivação para tratamento; alguma culpa por «não conseguir relaxar».",
    emotionalState:
      "Humor euthímico na sessão; irritabilidade leve referida na semana; sem ideação suicida.",
    personalHistory:
      "Desenvolvimento sem marcas relevantes; histórico de sobrecarga laboral e mudança de cidade há 2 anos.",
    psychicExam:
      "Orientação tempo/lugar/pessoa preservadas; linguagem coerente; atenção focada; humor congruente.",
    psychologicalConduct:
      "TCC: registro de pensamentos automáticos; técnicas de respiração diafragmática e exposição gradual.",
    familyGuidance:
      "Orientação sobre validação emocional e redução de cobrança excessiva em casa.",
  },
  {
    clinicalDiagnosis:
      "Episódio depressivo leve (CID F32.0), possível componente adaptativo relacionado a luto recente.",
    diagnosisReactions:
      "Choro na sessão; alívio ao verbalizar; expectativa realista em relação ao tempo de recuperação.",
    emotionalState: "Afeto retraído; anedonia parcial; insight preservado.",
    personalHistory:
      "Antecedentes familiares de humor disfórico (genitora); sem uso abusivo de substâncias.",
    psychicExam:
      "Psicomotoria desacelerada leve; não há delírios ou alucinações; julgamento preservado.",
    psychologicalConduct:
      "Ativação comportamental gradual; agenda de prazeres; monitoramento de sono.",
    familyGuidance:
      "Psicoeducação sobre depressão e importância de rotina de sono e exposição à luz natural.",
  },
  {
    clinicalDiagnosis:
      "Transtorno do espectro ansioso com sintomas somáticos (taquicardia, tensão muscular). CID F41.9.",
    diagnosisReactions:
      "Medo de «perder o controle» em público; busca por segurança com informação médica.",
    emotionalState:
      "Ansiedade moderada na avaliação; melhora após psicoeducação sobre resposta de alarme.",
    personalHistory:
      "Primeiro episódio; tentativa prévia de automedicação com fitoterápicos (descontinuados).",
    psychicExam:
      "Hipervigilância discreta; linguagem acelerada sob estresse simulado (role-play); sem desorganização.",
    psychologicalConduct:
      "Entrevista motivacional + REBT para disputar catastrofização; plano de enfrentamento.",
    familyGuidance:
      "Evitar reforço inadvertido de comportamentos de evitação; comunicação assertiva no trabalho.",
  },
  {
    clinicalDiagnosis:
      "TEPT subsindrômico em investigação (CID Z03.8); história de evento traumático ocupacional.",
    diagnosisReactions:
      "Ambivalência sobre «ser forte» vs pedir ajuda; abertura ao vínculo terapêutico.",
    emotionalState: "Labilidade emocional pontual; hipervigilância noturna referida.",
    personalHistory:
      "Sem internações; uso social de álcool aos fins de semana (baixo risco); rede social restrita.",
    psychicExam:
      "Flashbacks não relatados na sessão atual; dissociação não observada; foco mantido.",
    psychologicalConduct:
      "Estabilização (grounding); narrativa testemunhal gradual; preparação para EMDR futuro.",
    familyGuidance: "Orientação sobre gatilhos ambientais e rotina de sono segura.",
  },
  {
    clinicalDiagnosis:
      "Burnout em grau moderado (CID Z73.0 associado a estresse laboral crônico).",
    diagnosisReactions:
      "Reconhecimento do esgotamento; culpa por ausências na família; desejo de mudança de postura.",
    emotionalState: "Cansaço referido; irritabilidade em picos; humor estável na sessão.",
    personalHistory:
      "Jornada extensa; metas excessivas; poucas pausas; sem histórico psiquiátrico prévio.",
    psychicExam: "Atividade mental sob pressão; sem psicose; insight bom sobre fatores mantenedores.",
    psychologicalConduct:
      "Reestruturação de rotina; limites no trabalho; mindfulness breve (10 min/dia).",
    familyGuidance: "Distribuição de tarefas domésticas e rituais de reconexão com parceiro(a).",
  },
]

function fakeClinicalFields(seed: number) {
  return CLINICAL_VARIANTS[mod(seed, CLINICAL_VARIANTS.length)]
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m
}

type SeedDoctor = { id: number; name: string }
type SeedPatient = {
  id: number
  name: string
  phone: string | null
  sex: SeedSex | null
  birthDate: Date | null
  maritalStatus: string | null
  education: string | null
  profession: string | null
  religion: string | null
}

async function createDemoAppointment(opts: {
  doctor: SeedDoctor
  patient: SeedPatient
  dateStr: string
  slotStartIdx: number
  pipeline: StatusPipeline
  counter: number
  consultationFee: number
  followUpFee: number
}): Promise<number> {
  const {
    doctor,
    patient,
    dateStr,
    slotStartIdx,
    pipeline,
    counter,
    consultationFee,
    followUpFee,
  } = opts

  const slotTime = allocateSlotTime(doctor.id, dateStr, slotStartIdx)
  if (!slotTime) return counter

  const scheduledStart = combineLocalDateTime(dateStr, slotTime)
  const startedAt = combineLocalDateTime(dateStr, slotTime)
  const endedAt = new Date(scheduledStart.getTime() + 60 * 60 * 1000)

  const baseAg = {
    scheduledStart,
    patientId: patient.id,
    doctorId: doctor.id,
    patientNameSnapshot: patient.name,
    professionalNameSnapshot: doctor.name,
    phoneSnapshot: patient.phone ?? "",
  }

  if (pipeline === "past_cancelado") {
    await prisma.appointment.create({
      data: { ...baseAg, status: AppointmentStatus.Cancelled },
    })
    return counter + 1
  }

  if (
    pipeline === "past_concluido_consulta" ||
    pipeline === "past_concluido_retorno" ||
    pipeline === "today_pago" ||
    pipeline === "today_em_atendimento"
  ) {
    const isRetorno = pipeline === "past_concluido_retorno"
    const category = isRetorno ? "Retorno" : "Consulta"
    const amount = feeAmountWithVariance(isRetorno ? followUpFee : consultationFee)
    const completed = pipeline === "today_em_atendimento" || pipeline.startsWith("past_concluido")

    const ag = await prisma.appointment.create({
      data: {
        ...baseAg,
        type: isRetorno ? "Retorno" : "Consulta",
        status:
          pipeline === "today_em_atendimento"
            ? AppointmentStatus.InProgress
            : pipeline === "today_pago"
              ? AppointmentStatus.Paid
              : AppointmentStatus.Completed,
        startedAt: pipeline === "today_pago" ? null : startedAt,
        endedAt: completed ? endedAt : null,
        accumulatedMs: completed ? 45 * 60 * 1000 : 0,
      },
    })

    await prisma.transaction.create({
      data: {
        type: "Receita",
        category,
        description: `${category} — ${patient.name} com ${doctor.name}`,
        amount,
        competenceDate: localDateOnly(dateStr),
        paidAt: scheduledStart,
        paymentMethod: PAYMENT_METHODS[counter % PAYMENT_METHODS.length],
        status: "Confirmado",
        appointmentId: ag.id,
      },
    })

    if (pipeline.startsWith("past_concluido") || pipeline === "today_em_atendimento") {
      const clinical = fakeClinicalFields(counter + (pipeline === "today_em_atendimento" ? 17 : 0))
      await prisma.medicalRecord.create({
        data: {
          appointmentId: ag.id,
          patientId: patient.id,
          status: pipeline === "today_em_atendimento" ? "DRAFT" : "SIGNED",
          patientLabel: patient.name,
          psychologist: doctor.name,
          gender: patient.sex ?? undefined,
          birthDate: dateOnlyToString(patient.birthDate) ?? undefined,
          maritalStatus: patient.maritalStatus ?? undefined,
          education: patient.education ?? undefined,
          occupation: patient.profession ?? undefined,
          religion: patient.religion ?? undefined,
          caregiver:
            counter % 5 === 0 ? "Familiar acompanha sessões quando solicitado." : undefined,
          ...clinical,
        },
      })
    }

    return counter + 1
  }

  const status =
    pipeline === "today_registrar"
      ? AppointmentStatus.CheckIn
      : pipeline === "today_confirmado" || pipeline === "future_confirmado"
        ? AppointmentStatus.Confirmed
        : pipeline === "future_aguardando"
          ? AppointmentStatus.AwaitingConfirmation
          : AppointmentStatus.Scheduled

  await prisma.appointment.create({ data: { ...baseAg, status } })
  return counter + 1
}

async function main() {
  console.log("Removendo dados clínicos e lançamentos (mantendo usuários NextAuth)...")

  await prisma.appointmentStatusHistory.deleteMany()
  await prisma.appointmentProcedure.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.medicalRecord.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.patient.deleteMany()
  await prisma.doctor.deleteMany()
  await prisma.specialty.deleteMany()
  await prisma.procedure.deleteMany()
  await prisma.financialConfig.deleteMany()

  const config = await prisma.financialConfig.create({
    data: {
      consultationFee: 180,
      followUpFee: 95,
      doctorCommissionRate: 45,
    },
  })
  const consultationFee = Number(config.consultationFee)
  const followUpFee = Number(config.followUpFee)

  console.log("Inserindo médicos (com especialidades normalizadas)...")
  const doctors = await Promise.all(
    DOCTOR_SEED.map((m, i) =>
      prisma.doctor.create({
        data: {
          name: m.name,
          crm: m.crm,
          sex: m.sex,
          shift: m.shift,
          active: true,
          phone: demoPhone(100 + i),
          email: `medico.${i + 1}@clinicademo.local`,
          city: "São Paulo",
          state: "SP",
          street: "Av. Paulista",
          number: String(1000 + i * 11),
          neighborhood: "Bela Vista",
          zipCode: `01310${100 + i}`.slice(0, 9),
          specialty: {
            connectOrCreate: {
              where: { name: m.specialty },
              create: { name: m.specialty },
            },
          },
        },
      })
    )
  )

  console.log("Inserindo pacientes...")
  const patients = await Promise.all(
    PATIENT_NAMES.map((patientName, i) => {
      const loc = CITY_STATE_SAMPLES[i % CITY_STATE_SAMPLES.length]
      const nasc = format(addDays(new Date(1978, 0, 1), i * 127), "yyyy-MM-dd")
      const sex: SeedSex = i % 3 === 0 ? "Feminino" : i % 3 === 1 ? "Masculino" : "Outro"
      return prisma.patient.create({
        data: {
          name: patientName,
          cpf: padCpf(i),
          birthDate: localDateOnly(nasc),
          sex,
          phone: demoPhone(i),
          email: `paciente.${i + 1}@email-demo.local`,
          city: loc.city,
          state: loc.state,
          zipCode: `${13000 + (i % 899)}${(i * 11) % 999}`.slice(0, 9),
          street: `Rua Exemplo ${200 + i}`,
          number: String((i % 90) + 1),
          neighborhood: "Centro",
          insurancePlan: INSURANCE_PLANS[i % INSURANCE_PLANS.length] ?? undefined,
          insuranceNumber: INSURANCE_PLANS[i % INSURANCE_PLANS.length] ? `CRT-${10000 + i}` : undefined,
          maritalStatus: ["Solteiro(a)", "Casado(a)", "União estável"][i % 3],
          education: ["Ensino superior", "Pós-graduação", "Ensino médio"][i % 3],
          profession: ["Administrativo", "Engenheiro(a)", "Professor(a)", "Autônomo"][i % 4],
          religion: ["Católica", "Evangélica", "Espírita", "Sem religião", "Não informado"][i % 5],
        },
      })
    })
  )

  console.log("Gerando agendamentos e vínculos (prontuário / pagamento)...")

  let apptCounter = 0
  const testeDoctor = doctors[0]
  const standaloneTx: Array<{
    type: "Receita" | "Despesa"
    category: string
    description: string
    amount: number
    competenceDate: Date
    paymentMethod?: string
    status: "Confirmado" | "Pendente"
    paidAt?: Date
  }> = []

  for (let offset = -52; offset <= 28; offset++) {
    const day = addDays(TODAY, offset)
    const dow = day.getDay()
    if (dow === 0 || dow === 6) continue

    const dateStr = format(day, "yyyy-MM-dd")
    const density = 7 + (Math.abs(offset) % 5)

    for (let k = 0; k < density; k++) {
      const doctor =
        mod(offset + k, 3) === 0 ? testeDoctor : doctors[mod(offset + k, doctors.length)]
      const patient = patients[mod(apptCounter + k * 3, patients.length)]
      const pipeline = pickPipeline(dateStr, apptCounter + offset + k)

      apptCounter = await createDemoAppointment({
        doctor,
        patient,
        dateStr,
        slotStartIdx: (offset + k * 2) % TIME_SLOTS.length,
        pipeline,
        counter: apptCounter,
        consultationFee,
        followUpFee,
      })
    }
  }

  console.log("Gerando volume extra para Dr.Teste...")
  let testeExtra = 0
  for (let offset = -90; offset <= 21; offset++) {
    const day = addDays(TODAY, offset)
    const dow = day.getDay()
    if (dow === 0 || dow === 6) continue

    const dateStr = format(day, "yyyy-MM-dd")
    const extraDensity = offset >= -21 ? 10 : 6

    for (let k = 0; k < extraDensity; k++) {
      const patient = patients[mod(apptCounter + testeExtra + k * 7, patients.length)]
      const pipeline = pickPipeline(dateStr, apptCounter + testeExtra + offset + k + 3)

      const before = apptCounter
      apptCounter = await createDemoAppointment({
        doctor: testeDoctor,
        patient,
        dateStr,
        slotStartIdx: (offset + k * 3 + 1) % TIME_SLOTS.length,
        pipeline,
        counter: apptCounter,
        consultationFee,
        followUpFee,
      })
      if (apptCounter > before) testeExtra++
    }
  }

  console.log(`Dr.Teste: +${testeExtra} agendamentos adicionais.`)

  console.log("Lançamentos financeiros avulsos (últimos meses)...")

  for (let m = 0; m < 4; m++) {
    const baseMonth = addDays(TODAY, -30 * m)
    const y = baseMonth.getFullYear()
    const mo = String(baseMonth.getMonth() + 1).padStart(2, "0")

    for (let i = 0; i < 6; i++) {
      const day = 3 + ((m * 7 + i * 5) % 25)
      const entryDate = `${y}-${mo}-${String(day).padStart(2, "0")}`
      const cat = RECEITA_CATEGORIAS[(m + i) % RECEITA_CATEGORIAS.length]
      const status = i % 5 === 0 ? "Pendente" : "Confirmado"
      standaloneTx.push({
        type: "Receita",
        category: cat,
        description: `Receita avulsa — ${cat.toLowerCase()} (demo)`,
        amount: Math.round((80 + i * 37 + m * 12) * 100) / 100,
        competenceDate: localDateOnly(entryDate),
        paymentMethod: PAYMENT_METHODS[i % PAYMENT_METHODS.length],
        status,
        paidAt: status === "Confirmado" ? localDateOnly(entryDate) : undefined,
      })
    }

    for (let i = 0; i < 8; i++) {
      const day = 2 + ((m * 3 + i * 4) % 26)
      const entryDate = `${y}-${mo}-${String(day).padStart(2, "0")}`
      const cat = DESPESA_CATEGORIAS[(m + i * 2) % DESPESA_CATEGORIAS.length]
      standaloneTx.push({
        type: "Despesa",
        category: cat,
        description: `Despesa — ${cat.toLowerCase()} (demo)`,
        amount: Math.round((450 + i * 120 + m * 55) * 100) / 100,
        competenceDate: localDateOnly(entryDate),
        paymentMethod: i % 4 === 0 ? "Transferência" : "Não aplicável",
        status: "Confirmado",
        paidAt: localDateOnly(entryDate),
      })
    }
  }

  await prisma.transaction.createMany({ data: standaloneTx })

  console.log("Criando usuários vinculados aos médicos...")
  const doctorPasswordHash = hashSync(DEFAULT_DOCTOR_PASSWORD, 10)
  for (let i = 0; i < doctors.length; i++) {
    const doctor = doctors[i]
    await prisma.user.upsert({
      where: { email: doctor.email ?? `medico.${doctor.id}@clinicademo.local` },
      create: {
        name: doctor.name,
        email: doctor.email ?? `medico.${doctor.id}@clinicademo.local`,
        password: doctorPasswordHash,
        role: i === 0 ? "SUPER_ADMIN" : "MEDICO",
        doctorId: doctor.id,
      },
      update: {
        name: doctor.name,
        role: i === 0 ? "SUPER_ADMIN" : "MEDICO",
        doctorId: doctor.id,
      },
    })
  }

  console.log("Garantindo no máximo um atendimento em andamento por médico...")
  const inProgressRows = await prisma.appointment.findMany({
    where: { status: AppointmentStatus.InProgress },
    orderBy: { id: "asc" },
    select: { id: true, doctorId: true, scheduledStart: true },
  })
  const doctorsWithActive = new Set<number>()
  for (const row of inProgressRows) {
    if (doctorsWithActive.has(row.doctorId)) {
      await prisma.appointment.update({
        where: { id: row.id },
        data: {
          status: AppointmentStatus.Completed,
          endedAt: row.scheduledStart,
        },
      })
      continue
    }
    doctorsWithActive.add(row.doctorId)
  }

  console.log(
    `Concluído: ${doctors.length} médicos, ${patients.length} pacientes, ~${apptCounter} agendamentos, ` +
      `${standaloneTx.length} transações avulsas + vínculos em consultas concluídas. ` +
      `Usuários médicos: e-mail medico.N@clinicademo.local / senha ${DEFAULT_DOCTOR_PASSWORD}`
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
