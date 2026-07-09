import { addDays, format } from "date-fns"
import type { PrismaClient } from "../src/generated/prisma/client"
import { AppointmentStatus } from "../src/lib/schedule/status"
import { NOTIFICATION_TYPE } from "../src/lib/notification/constants"
import { formatTaskReminderAction } from "../src/lib/notification/reminder-config"
import { localDateOnly } from "../src/lib/datetime/appointment-time"
import { buildExtraReceitaSeed } from "./finance-demo-data"
import { PROCEDURE_CATALOG } from "./seed-procedures-data"

function mod(n: number, m: number): number {
  return ((n % m) + m) % m
}

const PRESCRIPTION_TEMPLATES = [
  {
    notes: "Prescrição psiquiátrica — revisão em 30 dias.",
    items: [
      { drug: "Sertralina", dosage: "50 mg", instructions: "1 comprimido pela manhã, após café" },
      { drug: "Clonazepam", dosage: "0,5 mg", instructions: "Se necessário, até 2x/dia (máx. 14 dias)" },
    ],
  },
  {
    notes: "Ajuste posológico após retorno.",
    items: [
      { drug: "Escitalopram", dosage: "10 mg", instructions: "1 comprimido à noite" },
    ],
  },
  {
    notes: "Esquema para insônia associada à ansiedade.",
    items: [
      { drug: "Quetiapina", dosage: "25 mg", instructions: "1 comprimido 30 min antes de deitar" },
      { drug: "Melatonina", dosage: "3 mg", instructions: "1 comprimido à noite, se necessário" },
    ],
  },
  {
    notes: "Manutenção — transtorno depressivo recorrente.",
    items: [
      { drug: "Venlafaxina", dosage: "75 mg", instructions: "1 cápsula pela manhã com alimento" },
    ],
  },
  {
    notes: "Prescrição combinada — TDAH adulto.",
    items: [
      { drug: "Bupropiona", dosage: "150 mg", instructions: "1 comprimido pela manhã" },
      { drug: "Metilfenidato", dosage: "10 mg", instructions: "1 comprimido pela manhã (receita B)" },
    ],
  },
  {
    notes: "Estabilizador de humor — acompanhamento quinzenal.",
    items: [
      { drug: "Lítio (carbonato)", dosage: "300 mg", instructions: "1 comprimido 12/12h — monitorar níveis" },
      { drug: "Risperidona", dosage: "1 mg", instructions: "1 comprimido à noite" },
    ],
  },
] as const

const ATTACHMENT_TEMPLATES = [
  { fileName: "escala-beck-ansiedade.pdf", mimeType: "application/pdf", sizeBytes: 245_000 },
  { fileName: "laudo-neuropsicologico-resumo.pdf", mimeType: "application/pdf", sizeBytes: 512_000 },
  { fileName: "termo-consentimento-assinado.pdf", mimeType: "application/pdf", sizeBytes: 128_000 },
  { fileName: "relatorio-escolar-encaminhamento.pdf", mimeType: "application/pdf", sizeBytes: 890_000 },
  { fileName: "exame-laboratorial-recente.pdf", mimeType: "application/pdf", sizeBytes: 156_000 },
] as const

const USER_TASK_TEMPLATES = [
  {
    title: "Revisar prontuários pendentes de assinatura",
    description: "Conferir 3 prontuários da semana e assinar digitalmente.",
    priority: "high" as const,
    status: "pending" as const,
    daysOffset: 0,
    hoursOffset: 4,
  },
  {
    title: "Confirmar retornos da próxima semana",
    description: "Ligar para pacientes com retorno agendado e confirmar presença.",
    priority: "medium" as const,
    status: "in_progress" as const,
    daysOffset: 1,
    hoursOffset: 10,
  },
  {
    title: "Enviar relatório mensal ao convênio",
    description: "Consolidar atendimentos Unimed e Amil do mês corrente.",
    priority: "high" as const,
    status: "pending" as const,
    daysOffset: 2,
    hoursOffset: 14,
  },
  {
    title: "Atualizar cadastro de pacientes incompletos",
    description: "Verificar CPF, telefone e plano de saúde nos cadastros recentes.",
    priority: "low" as const,
    status: "pending" as const,
    daysOffset: 3,
    hoursOffset: 9,
  },
  {
    title: "Reunião clínica — casos complexos",
    description: "Discussão multidisciplinar de casos em supervisão.",
    priority: "medium" as const,
    status: "completed" as const,
    daysOffset: -1,
    hoursOffset: 16,
  },
  {
    title: "Conferir repasses financeiros do mês",
    description: "Validar comissões e repasses por profissional.",
    priority: "medium" as const,
    status: "pending" as const,
    daysOffset: 5,
    hoursOffset: 11,
  },
  {
    title: "Preparar material para workshop corporativo",
    description: "Slides e dinâmica para palestra sobre saúde mental no trabalho.",
    priority: "low" as const,
    status: "in_progress" as const,
    daysOffset: 7,
    hoursOffset: 15,
  },
  {
    title: "Solicitar exames complementares — paciente em acompanhamento",
    description: "Hemograma, TSH e função hepática para revisão medicamentosa.",
    priority: "high" as const,
    status: "pending" as const,
    daysOffset: 0,
    hoursOffset: 18,
  },
]

const STATUS_FLOW: string[] = [
  AppointmentStatus.Scheduled,
  AppointmentStatus.AwaitingConfirmation,
  AppointmentStatus.Confirmed,
  AppointmentStatus.CheckIn,
  AppointmentStatus.AwaitingPayment,
  AppointmentStatus.Paid,
  AppointmentStatus.InProgress,
  AppointmentStatus.Completed,
]

export async function seedProcedureCatalog(client: PrismaClient) {
  const procedures = []
  for (const p of PROCEDURE_CATALOG) {
    procedures.push(
      await client.procedure.create({
        data: { name: p.name, defaultPrice: p.defaultPrice, active: true },
      })
    )
  }
  return procedures
}

export async function linkProceduresToAppointments(
  client: PrismaClient,
  procedureIds: number[]
) {
  if (procedureIds.length === 0) return 0

  const appointments = await client.appointment.findMany({
    where: {
      deletedAt: null,
      status: { in: [AppointmentStatus.Completed, AppointmentStatus.Paid, AppointmentStatus.InProgress] },
    },
    select: { id: true, type: true },
    orderBy: { id: "asc" },
  })

  const rows: Array<{
    appointmentId: number
    procedureId: number
    quantity: number
    unitPrice: number
  }> = []

  for (let i = 0; i < appointments.length; i++) {
    const appt = appointments[i]
    const primaryIdx =
      appt.type === "Retorno"
        ? mod(i, 3) + 1
        : mod(i, procedureIds.length)
    const primaryId = procedureIds[primaryIdx]
    const primaryPrice = PROCEDURE_CATALOG[primaryIdx]?.defaultPrice ?? 180

    rows.push({
      appointmentId: appt.id,
      procedureId: primaryId,
      quantity: 1,
      unitPrice: primaryPrice,
    })

    if (i % 4 === 0 && procedureIds.length > 2) {
      const extraIdx = mod(i + 5, procedureIds.length)
      rows.push({
        appointmentId: appt.id,
        procedureId: procedureIds[extraIdx],
        quantity: 1,
        unitPrice: PROCEDURE_CATALOG[extraIdx]?.defaultPrice ?? 80,
      })
    }
  }

  if (rows.length === 0) return 0
  const { count } = await client.appointmentProcedure.createMany({ data: rows })
  return count
}

export async function enrichMedicalRecords(client: PrismaClient) {
  const records = await client.medicalRecord.findMany({
    where: { deletedAt: null, status: { in: ["SIGNED", "AMENDED"] } },
    select: { id: true, status: true },
    orderBy: { id: "asc" },
    take: 250,
  })

  let rxCount = 0
  let attachCount = 0

  for (let i = 0; i < records.length; i++) {
    const record = records[i]

    if (i % 2 !== 0) {
      const template = PRESCRIPTION_TEMPLATES[i % PRESCRIPTION_TEMPLATES.length]
      await client.prescription.create({
        data: {
          medicalRecordId: record.id,
          notes: template.notes,
          items: {
            create: template.items.map((item) => ({
              drug: item.drug,
              dosage: item.dosage,
              instructions: item.instructions,
            })),
          },
        },
      })
      rxCount++
    }

    if (i % 3 === 0) {
      const att = ATTACHMENT_TEMPLATES[i % ATTACHMENT_TEMPLATES.length]
      await client.attachment.create({
        data: {
          medicalRecordId: record.id,
          fileName: att.fileName,
          fileUrl: `/uploads/demo/${att.fileName}`,
          mimeType: att.mimeType,
          sizeBytes: att.sizeBytes,
        },
      })
      attachCount++
    }

    if (i % 17 === 0 && record.status === "SIGNED") {
      await client.medicalRecord.update({
        where: { id: record.id },
        data: { status: "AMENDED" },
      })
    }
  }

  return { rxCount, attachCount }
}

export async function seedAppointmentStatusHistory(
  client: PrismaClient,
  defaultUserId: string | null
) {
  const appointments = await client.appointment.findMany({
    where: {
      deletedAt: null,
      status: {
        in: [
          AppointmentStatus.Completed,
          AppointmentStatus.InProgress,
          AppointmentStatus.Paid,
          AppointmentStatus.AwaitingPayment,
          AppointmentStatus.CheckIn,
        ],
      },
    },
    select: { id: true, status: true, scheduledStart: true },
    orderBy: { scheduledStart: "desc" },
    take: 180,
  })

  const rows: Array<{
    appointmentId: number
    fromStatus: string | null
    toStatus: string
    changedById: string | null
    changedAt: Date
  }> = []

  for (const appt of appointments) {
    const targetIdx = STATUS_FLOW.indexOf(appt.status)
    const steps = targetIdx >= 0 ? STATUS_FLOW.slice(0, targetIdx + 1) : STATUS_FLOW

    for (let s = 0; s < steps.length; s++) {
      const changedAt = new Date(appt.scheduledStart.getTime() - (steps.length - s) * 15 * 60 * 1000)
      rows.push({
        appointmentId: appt.id,
        fromStatus: s === 0 ? null : steps[s - 1],
        toStatus: steps[s],
        changedById: defaultUserId,
        changedAt,
      })
    }
  }

  if (rows.length === 0) return 0
  const { count } = await client.appointmentStatusHistory.createMany({ data: rows })
  return count
}

export async function seedUserTasks(client: PrismaClient, userIds: string[]) {
  if (userIds.length === 0) return 0

  const now = new Date()
  const rows = USER_TASK_TEMPLATES.flatMap((task, idx) => {
    const userId = userIds[idx % userIds.length]
    const dueAt = new Date(now)
    dueAt.setDate(dueAt.getDate() + task.daysOffset)
    dueAt.setHours(task.hoursOffset, 0, 0, 0)

    return {
      title: task.title,
      description: task.description,
      dueAt,
      status: task.status,
      priority: task.priority,
      userId,
    }
  })

  const { count } = await client.userTask.createMany({ data: rows })
  return count
}

type NotificationSeedItem = {
  type: (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE]
  hoursAgo: number
  unread: boolean
  archived: boolean
  title?: string
  description?: string
  entityType?: "Appointment" | "Patient" | "Transaction" | "Task" | "System"
  entityId?: string
  metadata?: Record<string, string>
  recipientUserIds: string[]
}

export async function seedRichNotifications(
  client: PrismaClient,
  recipientIds: string[],
  creatorId: string
) {
  if (recipientIds.length === 0) return 0

  const items: NotificationSeedItem[] = [
    {
      type: NOTIFICATION_TYPE.REMINDER,
      hoursAgo: 1,
      unread: true,
      archived: false,
      description: format(new Date(), "dd/MM/yyyy 'às' HH:mm"),
      metadata: {
        entityName: "Mariana Oliveira",
        action: "sua consulta começa em breve",
        isSystem: "true",
        reminderKind: "appointment",
      },
      recipientUserIds: recipientIds,
    },
    {
      type: NOTIFICATION_TYPE.REMINDER,
      hoursAgo: 3,
      unread: true,
      archived: false,
      metadata: {
        entityName: "Revisar prontuários pendentes",
        action: formatTaskReminderAction(15),
        isSystem: "true",
        reminderKind: "task",
      },
      recipientUserIds: recipientIds.slice(0, 1),
    },
    {
      type: NOTIFICATION_TYPE.MESSAGE,
      hoursAgo: 2,
      unread: true,
      archived: false,
      description: "Confirmado. Também reagendei o retorno do Pedro para quarta às 15:30.",
      metadata: { entityName: "Ana Recepção", action: "enviou uma mensagem" },
      recipientUserIds: recipientIds.slice(0, 1),
    },
    {
      type: NOTIFICATION_TYPE.APPOINTMENT,
      hoursAgo: 5,
      unread: true,
      archived: false,
      description: "Hoje às 14:30 — Consulta",
      metadata: { entityName: "Carlos Eduardo Lima", action: "atribuiu um agendamento a você" },
      entityType: "Appointment",
      recipientUserIds: recipientIds,
    },
    {
      type: NOTIFICATION_TYPE.STATUS_CHANGED,
      hoursAgo: 6,
      unread: false,
      archived: false,
      metadata: { entityName: "Confirmar retornos", action: "alterou o status de uma tarefa" },
      entityType: "Task",
      recipientUserIds: recipientIds.slice(0, 1),
    },
    {
      type: NOTIFICATION_TYPE.FINANCE,
      hoursAgo: 12,
      unread: false,
      archived: false,
      description: "R$ 180,00 — Consulta psiquiátrica",
      metadata: { entityName: "Receita confirmada", action: "registrou uma movimentação financeira" },
      entityType: "Transaction",
      recipientUserIds: recipientIds,
    },
    {
      type: NOTIFICATION_TYPE.PATIENT,
      hoursAgo: 24,
      unread: false,
      archived: false,
      metadata: { entityName: "Letícia Ferreira", action: "atualizou um paciente" },
      entityType: "Patient",
      recipientUserIds: recipientIds,
    },
    {
      type: NOTIFICATION_TYPE.SYSTEM,
      hoursAgo: 48,
      unread: false,
      archived: true,
      title: "Backup concluído",
      description: "Backup automático do prontuário eletrônico realizado com sucesso.",
      metadata: { entityName: "Sistema", action: "enviou uma notificação do sistema" },
      entityType: "System",
      recipientUserIds: recipientIds,
    },
    {
      type: NOTIFICATION_TYPE.APPOINTMENT,
      hoursAgo: 72,
      unread: false,
      archived: true,
      description: "Consulta cancelada pelo paciente",
      metadata: { entityName: "Rodrigo Castro", action: "atualizou um agendamento" },
      recipientUserIds: recipientIds.slice(0, 2),
    },
    {
      type: NOTIFICATION_TYPE.FINANCE,
      hoursAgo: 96,
      unread: false,
      archived: false,
      description: "Despesa pendente — aluguel sala comercial",
      metadata: { entityName: "Conta a pagar", action: "registrou uma movimentação financeira" },
      recipientUserIds: recipientIds.slice(0, 1),
    },
  ]

  let count = 0
  for (const item of items) {
    const createdAt = new Date(Date.now() - item.hoursAgo * 60 * 60 * 1000)
    await client.notification.create({
      data: {
        type: item.type,
        title: item.title,
        description: item.description,
        entityType: item.entityType,
        entityId: item.entityId,
        metadata: item.metadata,
        createdAt,
        createdById: creatorId,
        archivedAt: item.archived ? createdAt : null,
        recipients: {
          create: item.recipientUserIds.map((userId) => ({
            userId,
            readAt: item.unread ? null : createdAt,
            archivedAt: item.archived ? createdAt : null,
          })),
        },
      },
    })
    count++
  }

  return count
}

export async function seedDailyMetricSnapshots(client: PrismaClient, today = new Date()) {
  const rangeStart = addDays(today, -120)
  const rangeEnd = addDays(today, 1)

  const [appointments, patients, records, transactions] = await Promise.all([
    client.appointment.findMany({
      where: { deletedAt: null, scheduledStart: { gte: rangeStart, lt: rangeEnd } },
      select: { scheduledStart: true, status: true },
    }),
    client.patient.findMany({
      where: { deletedAt: null, createdAt: { gte: rangeStart, lt: rangeEnd } },
      select: { createdAt: true },
    }),
    client.medicalRecord.findMany({
      where: { deletedAt: null, createdAt: { gte: rangeStart, lt: rangeEnd } },
      select: { createdAt: true },
    }),
    client.transaction.findMany({
      where: {
        deletedAt: null,
        status: "Confirmado",
        competenceDate: { gte: rangeStart, lt: rangeEnd },
      },
      select: { competenceDate: true, type: true, amount: true },
    }),
  ])

  type DayAgg = {
    appointmentsTotal: number
    appointmentsDone: number
    cancelledCount: number
    newPatients: number
    recordsCreated: number
    revenue: number
    expenses: number
  }

  const byDay = new Map<string, DayAgg>()

  function ensureDay(dateStr: string): DayAgg {
    let agg = byDay.get(dateStr)
    if (!agg) {
      agg = {
        appointmentsTotal: 0,
        appointmentsDone: 0,
        cancelledCount: 0,
        newPatients: 0,
        recordsCreated: 0,
        revenue: 0,
        expenses: 0,
      }
      byDay.set(dateStr, agg)
    }
    return agg
  }

  for (const appt of appointments) {
    const dateStr = format(appt.scheduledStart, "yyyy-MM-dd")
    const agg = ensureDay(dateStr)
    agg.appointmentsTotal++
    if (appt.status === AppointmentStatus.Completed || appt.status === AppointmentStatus.Paid) {
      agg.appointmentsDone++
    }
    if (appt.status === AppointmentStatus.Cancelled) {
      agg.cancelledCount++
    }
  }

  for (const p of patients) {
    const dateStr = format(p.createdAt, "yyyy-MM-dd")
    ensureDay(dateStr).newPatients++
  }

  for (const r of records) {
    const dateStr = format(r.createdAt, "yyyy-MM-dd")
    ensureDay(dateStr).recordsCreated++
  }

  for (const tx of transactions) {
    const dateStr = format(tx.competenceDate, "yyyy-MM-dd")
    const agg = ensureDay(dateStr)
    const amount = Number(tx.amount)
    if (tx.type === "Receita") agg.revenue += amount
    else agg.expenses += amount
  }

  const rows = Array.from(byDay.entries()).map(([dateStr, agg]) => ({
    metricDate: localDateOnly(dateStr),
    appointmentsTotal: agg.appointmentsTotal,
    appointmentsDone: agg.appointmentsDone,
    noShowCount: Math.max(0, Math.floor(agg.cancelledCount * 0.15)),
    cancelledCount: agg.cancelledCount,
    newPatients: agg.newPatients,
    recordsCreated: agg.recordsCreated,
    revenue: agg.revenue,
    expenses: agg.expenses,
  }))

  if (rows.length === 0) return 0
  await client.dailyMetricSnapshot.deleteMany()
  const { count } = await client.dailyMetricSnapshot.createMany({ data: rows })
  return count
}

export async function seedExtraFinanceVariety(client: PrismaClient, today = new Date()) {
  const extraReceita = buildExtraReceitaSeed(today)
  await client.transaction.createMany({ data: extraReceita })

  const overdueRows = []
  for (let i = 0; i < 12; i++) {
    const dueDate = addDays(today, -5 - i * 3)
    overdueRows.push({
      type: "Despesa" as const,
      category: "Honorários (contador, advogado, etc.)",
      description: `Conta vencida — fornecedor ${i + 1}`,
      amount: 350 + i * 45,
      competenceDate: localDateOnly(format(dueDate, "yyyy-MM-dd")),
      dueDate: localDateOnly(format(dueDate, "yyyy-MM-dd")),
      status: "Vencido" as const,
      paymentMethod: "Boleto",
    })
  }

  for (let i = 0; i < 8; i++) {
    const dueDate = addDays(today, 3 + i * 2)
    overdueRows.push({
      type: "Receita" as const,
      category: "Convênio / coparticipação",
      description: `Repasse convênio pendente — lote ${i + 1}`,
      amount: 890 + i * 120,
      competenceDate: localDateOnly(format(today, "yyyy-MM-dd")),
      dueDate: localDateOnly(format(dueDate, "yyyy-MM-dd")),
      status: "Pendente" as const,
      paymentMethod: "Transferência",
    })
  }

  for (let i = 0; i < 5; i++) {
    overdueRows.push({
      type: "Despesa" as const,
      category: "Outros",
      description: `Despesa cancelada — estorno ${i + 1}`,
      amount: 200 + i * 30,
      competenceDate: localDateOnly(format(addDays(today, -20 - i), "yyyy-MM-dd")),
      status: "Cancelado" as const,
      paymentMethod: "Não aplicável",
    })
  }

  const { count } = await client.transaction.createMany({ data: overdueRows })
  return extraReceita.length + count
}

export async function patchTodayPipelineAppointments(client: PrismaClient) {
  const todayStr = format(new Date(), "yyyy-MM-dd")
  const dayStart = localDateOnly(todayStr)
  const dayEnd = addDays(dayStart, 1)

  const todayAppointments = await client.appointment.findMany({
    where: {
      deletedAt: null,
      scheduledStart: { gte: dayStart, lt: dayEnd },
      status: { in: [AppointmentStatus.Scheduled, AppointmentStatus.Confirmed] },
    },
    orderBy: { scheduledStart: "asc" },
    take: 20,
  })

  const statusPatches = [
    AppointmentStatus.AwaitingPayment,
    AppointmentStatus.Rescheduled,
    AppointmentStatus.AwaitingConfirmation,
  ]

  for (let i = 0; i < todayAppointments.length; i++) {
    if (i >= 6) break
    const patch = statusPatches[i % statusPatches.length]
    await client.appointment.update({
      where: { id: todayAppointments[i].id },
      data: { status: patch },
    })
  }

  const futureRescheduled = await client.appointment.findMany({
    where: {
      deletedAt: null,
      scheduledStart: { gt: dayEnd },
      status: AppointmentStatus.Scheduled,
    },
    orderBy: { scheduledStart: "asc" },
    take: 8,
  })

  for (const appt of futureRescheduled) {
    await client.appointment.update({
      where: { id: appt.id },
      data: { status: AppointmentStatus.Rescheduled },
    })
  }

  return todayAppointments.length
}
