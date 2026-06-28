/**
 * Seed de conversas demo — recepção, médicos e equipe.
 * Executável isolado: npm run db:seed-chat
 */
import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { hashSync } from "bcrypt"
import { PrismaClient } from "../src/generated/prisma/client"
import {
  DEMO_CHAT_THREADS,
  DEMO_GROUP_CHAT,
  RECEPTION_DEMO_USERS,
  messageTimestamp,
} from "../src/lib/chat/demo-data"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não definido.")
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

const RECEPTION_PASSWORD = "Recepcao123!"

async function ensureReceptionUsers() {
  const hash = hashSync(RECEPTION_PASSWORD, 10)
  for (const u of RECEPTION_DEMO_USERS) {
    await prisma.user.upsert({
      where: { email: u.email },
      create: {
        name: u.name,
        email: u.email,
        password: hash,
        role: u.role,
        active: true,
      },
      update: {
        name: u.name,
        role: u.role,
        active: true,
      },
    })
  }
}

async function clearChatData() {
  await prisma.messageRead.deleteMany()
  await prisma.messageReaction.deleteMany()
  await prisma.chatAttachment.deleteMany()
  await prisma.typingStatus.deleteMany()
  await prisma.message.deleteMany()
  await prisma.conversationParticipant.deleteMany()
  await prisma.conversation.deleteMany()
}

async function resolveUserMap() {
  const users = await prisma.user.findMany({
    where: { active: true },
    select: { id: true, email: true },
  })
  const map = new Map<string, string>()
  for (const u of users) map.set(u.email, u.id)
  return map
}

export async function seedChatDemo(client: PrismaClient = prisma) {
  await ensureReceptionUsers()
  await clearChatData()

  const userMap = await resolveUserMap()

  for (const thread of DEMO_CHAT_THREADS) {
    const userA = userMap.get(thread.userEmailA)
    const userB = userMap.get(thread.userEmailB)
    if (!userA || !userB) {
      console.warn(`Thread ignorada — usuário não encontrado: ${thread.userEmailA} / ${thread.userEmailB}`)
      continue
    }

    const lastMsgAt = messageTimestamp(
      thread.messages[thread.messages.length - 1]?.daysAgo ?? 0,
      thread.messages[thread.messages.length - 1]?.hoursAgo ?? 0
    )

    const conv = await client.conversation.create({
      data: {
        type: "Direct",
        lastMessageAt: lastMsgAt,
        participants: {
          create: [
            {
              userId: userA,
              category: thread.categoryA ?? null,
              isFavorite: thread.favoriteA ?? false,
              unreadCount: 0,
            },
            {
              userId: userB,
              category: thread.categoryB ?? null,
              unreadCount: thread.unreadB ?? 0,
            },
          ],
        },
      },
    })

    for (const msg of thread.messages) {
      const senderId = userMap.get(msg.fromEmail)
      if (!senderId) continue

      await client.message.create({
        data: {
          conversationId: conv.id,
          senderId,
          content: msg.content,
          status: senderId === userB && (thread.unreadB ?? 0) > 0 ? "Sent" : "Delivered",
          createdAt: messageTimestamp(msg.daysAgo, msg.hoursAgo ?? 0),
        },
      })
    }
  }

  const groupEmails = DEMO_GROUP_CHAT.participantEmails
  const groupUserIds = groupEmails
    .map((e) => userMap.get(e))
    .filter((id): id is string => Boolean(id))

  if (groupUserIds.length >= 2) {
    const lastGroupMsg = DEMO_GROUP_CHAT.messages[DEMO_GROUP_CHAT.messages.length - 1]
    const groupLastAt = messageTimestamp(lastGroupMsg?.daysAgo ?? 0)

    const groupConv = await client.conversation.create({
      data: {
        type: "Group",
        title: DEMO_GROUP_CHAT.title,
        lastMessageAt: groupLastAt,
        participants: {
          create: groupUserIds.map((userId) => ({
            userId,
            category: "Equipe",
          })),
        },
      },
    })

    for (const msg of DEMO_GROUP_CHAT.messages) {
      const senderId = userMap.get(msg.fromEmail)
      if (!senderId) continue
      await client.message.create({
        data: {
          conversationId: groupConv.id,
          senderId,
          content: msg.content,
          status: "Delivered",
          createdAt: messageTimestamp(msg.daysAgo),
        },
      })
    }
  }

  const threadCount = DEMO_CHAT_THREADS.length + (groupUserIds.length >= 2 ? 1 : 0)
  return { threadCount, receptionPassword: RECEPTION_PASSWORD }
}

async function main() {
  console.log("Semeando conversas demo do chat...")
  const { threadCount, receptionPassword } = await seedChatDemo()
  console.log(
    `Chat demo: ${threadCount} conversas criadas.\n` +
      `Recepção: recepcao@clinicademo.local / ${receptionPassword}\n` +
      `          atendimento@clinicademo.local / ${receptionPassword}\n` +
      `Super Admin: demo@clinica.local / demo123456\n` +
      `Médicos: medico.N@clinicademo.local / Medico123!`
  )
}

const isDirectRun = process.argv[1]?.replace(/\\/g, "/").includes("chat-demo-seed")
if (isDirectRun) {
  main()
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
      await pool.end()
    })
}
