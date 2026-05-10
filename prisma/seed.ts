// Seed de dados fictícios; preserva tabelas NextAuth.
import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { addDays, format } from "date-fns"
import { PrismaClient } from "../src/generated/prisma/client"
import { DESPESA_CATEGORIAS, RECEITA_CATEGORIAS } from "../src/lib/finance/categories"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não definido. Configure o .env antes de rodar o seed.")
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

const TODAY = new Date()

const TIME_SLOTS = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
]

const PAYMENT_METHODS = ["Pix", "Cartão de Crédito", "Cartão de Débito", "Dinheiro", "Convênio"]

const DOCTOR_SEED = [
  { name: "Dra. Helena Martins", crm: "CRM-SP 123456", specialty: "Psiquiatria", gender: "F", shift: "Manhã e tarde" },
  { name: "Dr. Ricardo Alves", crm: "CRM-SP 234567", specialty: "Psicologia clínica", gender: "M", shift: "Tarde" },
  { name: "Dra. Julia Costa", crm: "CRM-RJ 345678", specialty: "Neurologia", gender: "F", shift: "Manhã" },
  { name: "Dr. Fernando Dias", crm: "CRM-SP 456789", specialty: "Psiquiatria infantil", gender: "M", shift: "Manhã e tarde" },
  { name: "Dra. Camila Rocha", crm: "CRM-MG 567890", specialty: "Psicologia hospitalar", gender: "F", shift: "Integral" },
  { name: "Dr. Bruno Silveira", crm: "CRM-SP 678901", specialty: "Clínica médica", gender: "M", shift: "Manhã" },
  { name: "Dra. Paula Nogueira", crm: "CRM-SP 789012", specialty: "Terapia cognitivo-comportamental", gender: "F", shift: "Tarde" },
  { name: "Dr. Marcos Teixeira", crm: "CRM-BA 890123", specialty: "Psiquiatria", gender: "M", shift: "Manhã e tarde" },
  { name: "Dra. Larissa Freitas", crm: "CRM-SP 901234", specialty: "Psicologia do trabalho", gender: "F", shift: "Manhã" },
  { name: "Dr. André Cardoso", crm: "CRM-SP 012345", specialty: "Psiquiatria geriátrica", gender: "M", shift: "Tarde" },
]

const PATIENT_NAMES = [
  "Ana Beatriz Souza",
  "Carlos Eduardo Lima",
  "Mariana Oliveira",
  "Pedro Henrique Ramos",
  "Letícia Ferreira",
  "Gabriel Martins",
  "Fernanda Ribeiro",
  "Lucas Andrade",
  "Amanda Costa",
  "Rafael Moura",
  "Juliana Pereira",
  "Felipe Barbosa",
  "Beatriz Gomes",
  "Thiago Nunes",
  "Camila Duarte",
  "Rodrigo Castro",
  "Patricia Mendes",
  "Vinicius Lopes",
  "Daniela Azevedo",
  "Gustavo Reis",
  "Renata Carvalho",
  "Bruno Teixeira",
  "Larissa Monteiro",
  "Henrique Dias",
  "Vanessa Correia",
  "Mateus Pinto",
  "Bianca Rocha",
  "Caio Moreira",
  "Priscila Santos",
  "Leonardo Freitas",
  "Simone Almeida",
  "Diego Campos",
  "Claudia Vieira",
  "André Luiz Torres",
  "Fabiana Brito",
  "Igor Machado",
  "Tatiane Peixoto",
  "Marcelo Farias",
  "Renan Cardoso",
  "Adriana Macedo",
  "Paulo Sérgio Nunes",
  "Michele Antunes",
  "Eduardo Gonçalves",
  "Carla Regina Silva",
  "Rogério Bastos",
  "Silvia Helena Cruz",
  "Otávio Mendonça",
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

function isoAtLocalDay(dateStr: string, hour: number, minute: number): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(y, m - 1, d, hour, minute, 0, 0).toISOString()
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
    emotionalState:
      "Afeto retraído; anedonia parcial; insight preservado.",
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
    emotionalState:
      "Labilidade emocional pontual; hipervigilância noturna referida.",
    personalHistory:
      "Sem internações; uso social de álcool aos fins de semana (baixo risco); rede social restrita.",
    psychicExam:
      "Flashbacks não relatados na sessão atual; dissociação não observada; foco mantido.",
    psychologicalConduct:
      "Estabilização (grounding); narrativa testemunhal gradual; preparação para EMDR futuro.",
    familyGuidance:
      "Orientação sobre gatilhos ambientais e rotina de sono segura.",
  },
  {
    clinicalDiagnosis:
      "Burnout em grau moderado (CID Z73.0 associado a estresse laboral crônico).",
    diagnosisReactions:
      "Reconhecimento do esgotamento; culpa por ausências na família; desejo de mudança de postura.",
    emotionalState:
      "Cansaço referido; irritabilidade em picos; humor estável na sessão.",
    personalHistory:
      "Jornada extensa; metas excessivas; poucas pausas; sem histórico psiquiátrico prévio.",
    psychicExam:
      "Atividade mental sob pressão; sem psicose; insight bom sobre fatores mantenedores.",
    psychologicalConduct:
      "Reestruturação de rotina; limites no trabalho; mindfulness breve (10 min/dia).",
    familyGuidance:
      "Distribuição de tarefas domésticas e rituais de reconexão com parceiro(a).",
  },
]

function fakeClinicalFields(seed: number) {
  return CLINICAL_VARIANTS[mod(seed, CLINICAL_VARIANTS.length)]
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m
}

async function main() {
  console.log("Removendo dados clínicos e lançamentos (mantendo usuários NextAuth)...")

  await prisma.transaction.deleteMany()
  await prisma.clinicalChart.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.patient.deleteMany()
  await prisma.doctor.deleteMany()
  await prisma.financialConfig.deleteMany()

  const config = await prisma.financialConfig.create({
    data: {
      consultationFee: 180,
      followUpFee: 95,
      doctorCommissionRate: 45,
    },
  })

  console.log("Inserindo médicos...")
  const doctors = await Promise.all(
    DOCTOR_SEED.map((m, i) =>
      prisma.doctor.create({
        data: {
          name: m.name,
          crm: m.crm,
          specialty: m.specialty,
          gender: m.gender,
          shift: m.shift,
          active: true,
          phone: demoPhone(100 + i),
          email: `medico.${i + 1}@clinicademo.local`,
          city: "São Paulo",
          state: "SP",
          street: "Av. Paulista",
          number: String(1000 + i * 11),
          neighborhood: "Bela Vista",
          zipCode: `01310-${100 + i}`,
        },
      })
    )
  )

  console.log("Inserindo pacientes...")
  const patients = await Promise.all(
    PATIENT_NAMES.map((patientName, i) => {
      const loc = CITY_STATE_SAMPLES[i % CITY_STATE_SAMPLES.length]
      const nasc = format(addDays(new Date(1978, 0, 1), i * 127), "yyyy-MM-dd")
      return prisma.patient.create({
        data: {
          name: patientName,
          cpf: padCpf(i),
          birthDate: nasc,
          gender: i % 3 === 0 ? "F" : i % 3 === 1 ? "M" : "Outro",
          phone: demoPhone(i),
          email: `paciente.${i + 1}@email-demo.local`,
          city: loc.city,
          state: loc.state,
          zipCode: `${13000 + (i % 899)}-${(i * 11) % 999}`,
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
  const standaloneTx: Array<{
    type: string
    category: string
    description: string
    amount: number
    date: string
    paymentMethod?: string
    status: string
  }> = []

  for (let offset = -52; offset <= 28; offset++) {
    const day = addDays(TODAY, offset)
    const dow = day.getDay()
    if (dow === 0 || dow === 6) continue

    const dateStr = format(day, "yyyy-MM-dd")
    const density = 7 + (Math.abs(offset) % 5)

    for (let k = 0; k < density; k++) {
      const doctor = doctors[mod(offset + k, doctors.length)]
      const patient = patients[mod(apptCounter + k * 3, patients.length)]
      const slotTime = allocateSlotTime(doctor.id, dateStr, (offset + k * 2) % TIME_SLOTS.length)
      if (!slotTime) continue

      const pipeline = pickPipeline(dateStr, apptCounter + offset + k)
      const [hPart, mPart] = parseSlotTime(slotTime)
      const startIso = isoAtLocalDay(dateStr, hPart, mPart)
      const endIso = isoAtLocalDay(dateStr, hPart + 1, mPart)

      const baseAg = {
        date: dateStr,
        slotTime,
        patientId: patient.id,
        doctorId: doctor.id,
        patientName: patient.name,
        professionalName: doctor.name,
        phone: patient.phone ?? "",
      }

      if (pipeline === "past_cancelado") {
        await prisma.appointment.create({
          data: {
            ...baseAg,
            status: "Cancelado",
          },
        })
        apptCounter++
        continue
      }

      if (
        pipeline === "past_concluido_consulta" ||
        pipeline === "past_concluido_retorno" ||
        pipeline === "today_pago" ||
        pipeline === "today_em_atendimento"
      ) {
        const isRetorno = pipeline === "past_concluido_retorno"
        const category = isRetorno ? "Retorno" : "Consulta"
        const amount = feeAmountWithVariance(isRetorno ? config.followUpFee : config.consultationFee)

        const ag = await prisma.appointment.create({
          data: {
            ...baseAg,
            status:
              pipeline === "today_em_atendimento"
                ? "Em Atendimento"
                : pipeline === "today_pago"
                  ? "Pago"
                  : "Concluido",
            startTime: pipeline === "today_pago" ? undefined : startIso,
            endTime:
              pipeline === "today_em_atendimento" || pipeline.startsWith("past_concluido")
                ? endIso
                : undefined,
            accumulatedTime:
              pipeline === "today_em_atendimento" || pipeline.startsWith("past_concluido")
                ? 45 * 60 * 1000
                : undefined,
          },
        })

        await prisma.transaction.create({
          data: {
            type: "Receita",
            category,
            description: `${category} — ${patient.name} com ${doctor.name}`,
            amount,
            date: dateStr,
            paymentMethod: PAYMENT_METHODS[apptCounter % PAYMENT_METHODS.length],
            status: "Confirmado",
            appointmentId: ag.id,
          },
        })

        if (pipeline.startsWith("past_concluido")) {
          const clinical = fakeClinicalFields(apptCounter)
          await prisma.clinicalChart.create({
            data: {
              appointmentId: ag.id,
              patientId: patient.id,
              patientLabel: patient.name,
              psychologist: doctor.name,
              gender: patient.gender ?? undefined,
              birthDate: patient.birthDate ?? undefined,
              maritalStatus: patient.maritalStatus ?? undefined,
              education: patient.education ?? undefined,
              occupation: patient.profession ?? undefined,
              religion: patient.religion ?? undefined,
              caregiver:
                apptCounter % 5 === 0
                  ? "Familiar acompanha sessões quando solicitado."
                  : undefined,
              ...clinical,
            },
          })
        }

        if (pipeline === "today_em_atendimento") {
          const clinical = fakeClinicalFields(apptCounter + 17)
          await prisma.clinicalChart.create({
            data: {
              appointmentId: ag.id,
              patientId: patient.id,
              patientLabel: patient.name,
              psychologist: doctor.name,
              gender: patient.gender ?? undefined,
              birthDate: patient.birthDate ?? undefined,
              maritalStatus: patient.maritalStatus ?? undefined,
              education: patient.education ?? undefined,
              occupation: patient.profession ?? undefined,
              religion: patient.religion ?? undefined,
              ...clinical,
            },
          })
        }

        apptCounter++
        continue
      }

      if (pipeline === "today_registrar") {
        await prisma.appointment.create({
          data: {
            ...baseAg,
            status: "RegistrarChegada",
          },
        })
        apptCounter++
        continue
      }

      if (pipeline === "today_confirmado") {
        await prisma.appointment.create({
          data: {
            ...baseAg,
            status: "Confirmado",
          },
        })
        apptCounter++
        continue
      }

      if (pipeline === "future_confirmado") {
        await prisma.appointment.create({
          data: {
            ...baseAg,
            status: "Confirmado",
          },
        })
        apptCounter++
        continue
      }

      if (pipeline === "future_aguardando") {
        await prisma.appointment.create({
          data: {
            ...baseAg,
            status: "AguardandoConfirmacao",
          },
        })
        apptCounter++
        continue
      }

      await prisma.appointment.create({
        data: {
          ...baseAg,
          status: "Agendado",
        },
      })
      apptCounter++
    }
  }

  console.log("Lançamentos financeiros avulsos (últimos meses)...")

  for (let m = 0; m < 4; m++) {
    const baseMonth = addDays(TODAY, -30 * m)
    const y = baseMonth.getFullYear()
    const mo = String(baseMonth.getMonth() + 1).padStart(2, "0")

    for (let i = 0; i < 6; i++) {
      const day = 3 + ((m * 7 + i * 5) % 25)
      const entryDate = `${y}-${mo}-${String(day).padStart(2, "0")}`
      const cat = RECEITA_CATEGORIAS[(m + i) % RECEITA_CATEGORIAS.length]
      standaloneTx.push({
        type: "Receita",
        category: cat,
        description: `Receita avulsa — ${cat.toLowerCase()} (demo)`,
        amount: Math.round((80 + i * 37 + m * 12) * 100) / 100,
        date: entryDate,
        paymentMethod: PAYMENT_METHODS[i % PAYMENT_METHODS.length],
        status: i % 5 === 0 ? "Pendente" : "Confirmado",
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
        date: entryDate,
        paymentMethod: i % 4 === 0 ? "Transferência" : "Não aplicável",
        status: "Confirmado",
      })
    }
  }

  await prisma.transaction.createMany({ data: standaloneTx })

  console.log(
    `Concluído: ${doctors.length} médicos, ${patients.length} pacientes, ~${apptCounter} agendamentos, ` +
      `${standaloneTx.length} transações avulsas + vínculos em consultas concluídas.`
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
