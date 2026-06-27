/**
 * Dados demo do chat — usados no seed e nos testes unitários.
 */
export const CHAT_DEMO_CATEGORIES = ["Importante", "Trabalho", "Equipe"] as const

export type ChatDemoCategory = (typeof CHAT_DEMO_CATEGORIES)[number]

export type DemoThread = {
  /** e-mail do participante A (menor lexicograficamente para idempotência) */
  userEmailA: string
  userEmailB: string
  categoryA?: ChatDemoCategory
  categoryB?: ChatDemoCategory
  favoriteA?: boolean
  unreadB?: number
  messages: Array<{
    fromEmail: string
    content: string
    /** dias atrás */
    daysAgo: number
    hoursAgo?: number
  }>
}

export const RECEPTION_DEMO_USERS = [
  {
    name: "Ana Recepção",
    email: "recepcao@clinicademo.local",
    role: "ADMIN" as const,
  },
  {
    name: "Carlos Atendimento",
    email: "atendimento@clinicademo.local",
    role: "ADMIN" as const,
  },
] as const

export const DEMO_CHAT_THREADS: DemoThread[] = [
  {
    userEmailA: "recepcao@clinicademo.local",
    userEmailB: "medico.1@clinicademo.local",
    categoryA: "Trabalho",
    categoryB: "Trabalho",
    unreadB: 2,
    messages: [
      {
        fromEmail: "recepcao@clinicademo.local",
        content: "Bom dia, Dr(a)! A paciente Mariana chegou para a consulta das 09:00.",
        daysAgo: 0,
        hoursAgo: 2,
      },
      {
        fromEmail: "medico.1@clinicademo.local",
        content: "Obrigado, Ana. Pode encaminhar para a sala 2 em 5 minutos.",
        daysAgo: 0,
        hoursAgo: 1,
      },
      {
        fromEmail: "recepcao@clinicademo.local",
        content: "Confirmado. Também reagendei o retorno do Pedro para quarta às 15:30.",
        daysAgo: 0,
        hoursAgo: 0,
      },
    ],
  },
  {
    userEmailA: "atendimento@clinicademo.local",
    userEmailB: "medico.2@clinicademo.local",
    categoryA: "Trabalho",
    categoryB: "Trabalho",
    messages: [
      {
        fromEmail: "atendimento@clinicademo.local",
        content: "Dra. Helena, temos encaixe hoje à tarde. Posso confirmar?",
        daysAgo: 1,
        hoursAgo: 3,
      },
      {
        fromEmail: "medico.2@clinicademo.local",
        content: "Sim, pode confirmar para 16:00. Obrigada!",
        daysAgo: 1,
        hoursAgo: 2,
      },
    ],
  },
  {
    userEmailA: "medico.1@clinicademo.local",
    userEmailB: "medico.3@clinicademo.local",
    categoryA: "Equipe",
    categoryB: "Equipe",
    messages: [
      {
        fromEmail: "medico.1@clinicademo.local",
        content: "Dr. Ricardo, consegue revisar o laudo do paciente em interconsulta?",
        daysAgo: 2,
      },
      {
        fromEmail: "medico.3@clinicademo.local",
        content: "Claro! Envio ainda hoje até o final do expediente.",
        daysAgo: 2,
      },
      {
        fromEmail: "medico.1@clinicademo.local",
        content: "Perfeito. Obrigado pela agilidade.",
        daysAgo: 1,
      },
    ],
  },
  {
    userEmailA: "recepcao@clinicademo.local",
    userEmailB: "medico.4@clinicademo.local",
    categoryA: "Importante",
    categoryB: "Importante",
    favoriteA: true,
    unreadB: 1,
    messages: [
      {
        fromEmail: "recepcao@clinicademo.local",
        content: "URGENTE: convênio Unimed pediu autorização para exame de amanhã.",
        daysAgo: 0,
        hoursAgo: 4,
      },
      {
        fromEmail: "medico.4@clinicademo.local",
        content: "Já estou preenchendo a guia. Envio em 10 minutos.",
        daysAgo: 0,
        hoursAgo: 3,
      },
    ],
  },
  {
    userEmailA: "atendimento@clinicademo.local",
    userEmailB: "medico.5@clinicademo.local",
    categoryA: "Trabalho",
    messages: [
      {
        fromEmail: "atendimento@clinicademo.local",
        content: "Dr. Fernando, a mãe da paciente Julia ligou confirmando o horário.",
        daysAgo: 3,
      },
      {
        fromEmail: "medico.5@clinicademo.local",
        content: "Recebido. Consulta infantil confirmada.",
        daysAgo: 3,
      },
    ],
  },
]

export type DemoGroupChat = {
  title: string
  participantEmails: string[]
  messages: Array<{
    fromEmail: string
    content: string
    daysAgo: number
  }>
}

export const DEMO_GROUP_CHAT: DemoGroupChat = {
  title: "Equipe — Coordenação",
  participantEmails: [
    "recepcao@clinicademo.local",
    "atendimento@clinicademo.local",
    "medico.1@clinicademo.local",
    "medico.2@clinicademo.local",
  ],
  messages: [
    {
      fromEmail: "recepcao@clinicademo.local",
      content: "Pessoal, amanhã teremos reunião clínica às 08:30 na sala de apoio.",
      daysAgo: 1,
    },
    {
      fromEmail: "medico.1@clinicademo.local",
      content: "Confirmado. Vou preparar os casos da semana.",
      daysAgo: 1,
    },
    {
      fromEmail: "medico.2@clinicademo.local",
      content: "Estarei presente. @ana pode reservar o projetor?",
      daysAgo: 0,
    },
    {
      fromEmail: "atendimento@clinicademo.local",
      content: "Projetor reservado. Lista de presença na recepção.",
      daysAgo: 0,
    },
  ],
}

export function messageTimestamp(daysAgo: number, hoursAgo = 0): Date {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(d.getHours() - hoursAgo)
  return d
}
