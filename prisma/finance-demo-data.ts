import { addDays, format } from "date-fns"
import { localDateOnly } from "../src/lib/datetime/appointment-time"

export type StandaloneTxSeed = {
  type: "Receita" | "Despesa"
  category: string
  description: string
  amount: number
  competenceDate: Date
  paymentMethod?: string
  status: "Confirmado" | "Pendente"
  paidAt?: Date
}

const PAYMENT_METHODS = ["Pix", "Cartão de Crédito", "Cartão de Débito", "Dinheiro", "Convênio"]

const RECEITA_DEMO: Array<{ category: string; description: string; amount: number }> = [
  { category: "Avaliação", description: "Avaliação psicológica inicial — paciente particular", amount: 350 },
  { category: "Avaliação", description: "Laudo neuropsicológico — encaminhamento escolar", amount: 420 },
  { category: "Pacote ou combo", description: "Pacote 4 sessões TCC — plano trimestral", amount: 680 },
  { category: "Pacote ou combo", description: "Combo avaliação + retorno em 30 dias", amount: 520 },
  { category: "Convênio / coparticipação", description: "Coparticipação Unimed — sessão ambulatorial", amount: 85 },
  { category: "Convênio / coparticipação", description: "Repasse parcial Amil — lote mensal", amount: 1240 },
  { category: "Convênio / coparticipação", description: "Glosa recuperada Bradesco Saúde", amount: 380 },
  { category: "Venda de material", description: "Venda de diário terapêutico e material psychoeducativo", amount: 45 },
  { category: "Venda de material", description: "Kit mindfulness — pacientes grupo ansiedade", amount: 120 },
  { category: "Taxa administrativa", description: "Taxa de remarcação fora do prazo", amount: 60 },
  { category: "Taxa administrativa", description: "Taxa de emissão de relatório para convênio", amount: 90 },
  { category: "Juros ou multa recebida", description: "Multa por atraso — acordo particular", amount: 35 },
  { category: "Outros", description: "Workshop corporativo — saúde mental no trabalho", amount: 2800 },
  { category: "Outros", description: "Palestra escola — prevenção burnout docentes", amount: 950 },
  { category: "Outros", description: "Supervisão clínica externa recebida", amount: 400 },
  { category: "Consulta", description: "Consulta psiquiátrica — paciente particular", amount: 180 },
  { category: "Consulta", description: "Consulta — encaminhamento clínico geral", amount: 185 },
  { category: "Consulta", description: "Consulta — plano de saúde coparticipação", amount: 175 },
  { category: "Retorno", description: "Retorno pós-medicação — acompanhamento", amount: 95 },
  { category: "Retorno", description: "Retorno TCC — sessão de continuidade", amount: 98 },
  { category: "Avaliação", description: "Triagem inicial — encaminhamento convênio", amount: 280 },
  { category: "Pacote ou combo", description: "Pacote 8 sessões — terapia de casal", amount: 1280 },
  { category: "Convênio / coparticipação", description: "Repasse SulAmérica — quinzena 1", amount: 890 },
  { category: "Convênio / coparticipação", description: "Repasse SulAmérica — quinzena 2", amount: 1120 },
]

const DESPESA_DEMO: Array<{ category: string; description: string; amount: number }> = [
  { category: "Aluguel e condomínio", description: "Aluguel sala comercial — unidade principal", amount: 4200 },
  { category: "Aluguel e condomínio", description: "Condomínio e IPTU rateado", amount: 890 },
  { category: "Energia, água e gás", description: "Conta de energia elétrica", amount: 680 },
  { category: "Energia, água e gás", description: "Água e gás — refeitório e banheiros", amount: 210 },
  { category: "Material de consumo", description: "Material de escritório e higiene", amount: 320 },
  { category: "Material de consumo", description: "Descartáveis e EPIs — sala de procedimentos", amount: 185 },
  { category: "Equipamento e manutenção", description: "Manutenção ar-condicionado salas 2 e 3", amount: 450 },
  { category: "Equipamento e manutenção", description: "Calibragem equipamento EEG portátil", amount: 780 },
  { category: "Marketing e divulgação", description: "Campanha Google Ads — captação novos pacientes", amount: 650 },
  { category: "Marketing e divulgação", description: "Material gráfico e redes sociais", amount: 380 },
  { category: "Software e assinaturas", description: "Assinatura prontuário eletrônico", amount: 290 },
  { category: "Software e assinaturas", description: "Licenças Microsoft 365 e backup nuvem", amount: 165 },
  { category: "Impostos e taxas", description: "DAS Simples Nacional", amount: 1850 },
  { category: "Impostos e taxas", description: "Taxa municipal de funcionamento", amount: 420 },
  { category: "Salários e encargos", description: "Folha recepcionistas e auxiliar admin", amount: 5200 },
  { category: "Salários e encargos", description: "Encargos FGTS/INSS sobre folha", amount: 1480 },
  { category: "Honorários (contador, advogado, etc.)", description: "Honorários contabilidade mensal", amount: 550 },
  { category: "Telefonia e internet", description: "Internet fibra + telefonia fixa clínica", amount: 240 },
  { category: "Seguros", description: "Seguro responsabilidade civil profissional", amount: 310 },
  { category: "Limpeza e copa", description: "Serviço de limpeza terceirizada", amount: 900 },
  { category: "Treinamento e cursos", description: "Curso atualização TCC — equipe", amount: 720 },
  { category: "Transporte e combustível", description: "Combustível visitas domiciliares", amount: 280 },
  { category: "Despesas bancárias", description: "Tarifas PIX e manutenção conta PJ", amount: 95 },
  { category: "Outros", description: "Coffee break — reunião clínica mensal", amount: 140 },
]

function mod(n: number, m: number): number {
  return ((n % m) + m) % m
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

function monthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

/** Lançamentos avulsos distribuídos nos últimos 12 meses + densidade extra na semana atual. */
export function buildStandaloneFinanceSeed(today = new Date()): StandaloneTxSeed[] {
  const txs: StandaloneTxSeed[] = []
  const todayStr = format(today, "yyyy-MM-dd")

  for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
    const ref = monthStart(addDays(today, -30 * monthOffset))
    const y = ref.getFullYear()
    const mo = ref.getMonth()
    const daysInMo = new Date(y, mo + 1, 0).getDate()

    const receitaCount = monthOffset === 0 ? 35 : monthOffset <= 3 ? 24 : 16
    const despesaCount = monthOffset === 0 ? 22 : monthOffset <= 3 ? 16 : 12

    for (let i = 0; i < receitaCount; i++) {
      const template = RECEITA_DEMO[(monthOffset + i) % RECEITA_DEMO.length]
      const day = 1 + mod(i * 3 + monthOffset * 2, daysInMo)
      const entryDate = `${y}-${String(mo + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      const variance = 0.9 + mod(i + monthOffset, 5) * 0.05
      const status = monthOffset === 0 && i % 7 === 0 ? "Pendente" : "Confirmado"

      txs.push({
        type: "Receita",
        category: template.category,
        description: template.description,
        amount: roundMoney(template.amount * variance),
        competenceDate: localDateOnly(entryDate),
        paymentMethod: PAYMENT_METHODS[(i + monthOffset) % PAYMENT_METHODS.length],
        status,
        paidAt: status === "Confirmado" ? localDateOnly(entryDate) : undefined,
      })
    }

    for (let i = 0; i < despesaCount; i++) {
      const template = DESPESA_DEMO[(monthOffset + i * 2) % DESPESA_DEMO.length]
      const day = 2 + mod(i * 2 + monthOffset, daysInMo - 1)
      const entryDate = `${y}-${String(mo + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      const variance = 0.92 + mod(i * 3 + monthOffset, 4) * 0.04

      txs.push({
        type: "Despesa",
        category: template.category,
        description: template.description,
        amount: roundMoney(template.amount * variance),
        competenceDate: localDateOnly(entryDate),
        paymentMethod:
          i % 3 === 0 ? "Transferência" : i % 3 === 1 ? "Boleto" : "Não aplicável",
        status: "Confirmado",
        paidAt: localDateOnly(entryDate),
      })
    }
  }

  for (let offset = -6; offset <= 0; offset++) {
    const day = addDays(today, offset)
    const dow = day.getDay()
    if (dow === 0 || dow === 6) continue

    const dateStr = format(day, "yyyy-MM-dd")
    const weekIdx = offset + 6

    for (let r = 0; r < 6; r++) {
      const template = RECEITA_DEMO[(weekIdx + r) % RECEITA_DEMO.length]
      txs.push({
        type: "Receita",
        category: template.category,
        description: `${template.description} (${dateStr})`,
        amount: roundMoney(template.amount * (0.95 + r * 0.03)),
        competenceDate: localDateOnly(dateStr),
        paymentMethod: PAYMENT_METHODS[(weekIdx + r) % PAYMENT_METHODS.length],
        status: dateStr === todayStr && r === 2 ? "Pendente" : "Confirmado",
        paidAt: dateStr === todayStr && r === 2 ? undefined : localDateOnly(dateStr),
      })
    }

    for (let d = 0; d < 2; d++) {
      const template = DESPESA_DEMO[(weekIdx + d) % DESPESA_DEMO.length]
      txs.push({
        type: "Despesa",
        category: template.category,
        description: `${template.description} (${dateStr})`,
        amount: roundMoney(template.amount * 0.08 + 120 + d * 45),
        competenceDate: localDateOnly(dateStr),
        paymentMethod: d === 0 ? "Pix" : "Transferência",
        status: "Confirmado",
        paidAt: localDateOnly(dateStr),
      })
    }
  }

  return txs
}

const PACIENTE_NOMES = [
  "Ana Souza", "Carlos Lima", "Mariana Oliveira", "Pedro Ramos", "Letícia Ferreira",
  "Gabriel Martins", "Fernanda Ribeiro", "Lucas Andrade", "Amanda Costa", "Rafael Moura",
]

/** Receitas extras (consultas, retornos, convênios) — últimos 90 dias. */
export function buildExtraReceitaSeed(today = new Date()): StandaloneTxSeed[] {
  const txs: StandaloneTxSeed[] = []
  const todayStr = format(today, "yyyy-MM-dd")

  for (let offset = -90; offset <= 0; offset++) {
    const day = addDays(today, offset)
    const dow = day.getDay()
    if (dow === 0 || dow === 6) continue

    const dateStr = format(day, "yyyy-MM-dd")
    const density = offset >= -14 ? 8 : offset >= -45 ? 5 : 3

    for (let i = 0; i < density; i++) {
      const template = RECEITA_DEMO[(Math.abs(offset) + i) % RECEITA_DEMO.length]
      const paciente = PACIENTE_NOMES[(Math.abs(offset) + i) % PACIENTE_NOMES.length]
      const variance = 0.88 + mod(i + offset, 7) * 0.04
      const status = dateStr === todayStr && i === density - 1 ? "Pendente" : "Confirmado"

      txs.push({
        type: "Receita",
        category: template.category,
        description: `${template.description} — ${paciente}`,
        amount: roundMoney(template.amount * variance),
        competenceDate: localDateOnly(dateStr),
        paymentMethod: PAYMENT_METHODS[(Math.abs(offset) + i) % PAYMENT_METHODS.length],
        status,
        paidAt: status === "Confirmado" ? localDateOnly(dateStr) : undefined,
      })
    }
  }

  return txs
}
