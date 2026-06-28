/**
 * Seed de notificações demo — exemplos de lembretes e mensagens.
 * Executável isolado: npm run db:seed-notifications
 */
import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { PrismaClient } from "../src/generated/prisma/client"
import { NOTIFICATION_TYPE } from "../src/lib/notification/constants"
import { formatTaskReminderAction } from "../src/lib/notification/reminder-config"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não definido.")
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

type SeedItem = {
  type: (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE]
  hoursAgo: number
  unread: boolean
  archived: boolean
  description?: string
  metadata?: Record<string, string>
}

const SEED_ITEMS: SeedItem[] = [
  {
    type: NOTIFICATION_TYPE.REMINDER,
    hoursAgo: 2,
    unread: true,
    archived: false,
    description: "27/06/2026 às 14:30",
    metadata: {
      entityName: "João Silva",
      action: "sua consulta começa em breve",
      isSystem: "true",
      reminderKind: "appointment",
    },
  },
  {
    type: NOTIFICATION_TYPE.REMINDER,
    hoursAgo: 5,
    unread: true,
    archived: false,
    description: "27/06/2026 às 16:00",
    metadata: {
      entityName: "Revisar prontuários",
      action: formatTaskReminderAction(15),
      isSystem: "true",
      reminderKind: "task",
    },
  },
  {
    type: NOTIFICATION_TYPE.MESSAGE,
    hoursAgo: 8,
    unread: true,
    archived: false,
    description: "Olá, você pode confirmar o horário?",
    metadata: {
      entityName: "Conversa",
      action: "enviou uma mensagem",
    },
  },
  {
    type: NOTIFICATION_TYPE.APPOINTMENT,
    hoursAgo: 26,
    unread: false,
    archived: false,
    description: "26/06/2026 às 10:00",
    metadata: {
      entityName: "Maria Costa",
      action: "atribuiu um agendamento a você",
    },
  },
]

async function clearNotificationData(client: PrismaClient) {
  await client.notificationRecipient.deleteMany()
  await client.notification.deleteMany()
}

export async function seedNotificationsDemo(client: PrismaClient = prisma) {
  const targetUser = await client.user.findFirst({
    where: { active: true },
    orderBy: { createdAt: "asc" },
  })

  if (!targetUser) {
    throw new Error("Nenhum usuário ativo encontrado para receber notificações demo.")
  }

  await clearNotificationData(client)

  for (const item of SEED_ITEMS) {
    const createdAt = new Date(Date.now() - item.hoursAgo * 60 * 60 * 1000)

    await client.notification.create({
      data: {
        type: item.type,
        description: item.description,
        metadata: item.metadata,
        createdAt,
        createdById: targetUser.id,
        recipients: {
          create: {
            userId: targetUser.id,
            readAt: item.unread ? null : createdAt,
            archivedAt: item.archived ? createdAt : null,
          },
        },
      },
    })
  }
}

async function main() {
  await seedNotificationsDemo()
}

main()
  .then(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
  .catch(async (error) => {
    await prisma.$disconnect()
    await pool.end()
    throw error
  })
