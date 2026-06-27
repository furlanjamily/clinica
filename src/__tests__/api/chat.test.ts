// @vitest-environment node
import { getServerSession } from "next-auth"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/db", () => ({ db: {}, prisma: {} }))
vi.mock("@/lib/chat/service", () => ({
  listConversations: vi.fn().mockResolvedValue({ conversations: [], categories: [] }),
  createConversation: vi.fn().mockResolvedValue({ id: 1 }),
  listAvailableUsers: vi.fn().mockResolvedValue([]),
  getConversation: vi.fn().mockResolvedValue({ id: 1 }),
  getMessages: vi.fn().mockResolvedValue({ messages: [], hasMore: false, nextCursor: null }),
  sendMessage: vi.fn().mockResolvedValue({ id: 1 }),
  markMessagesAsRead: vi.fn().mockResolvedValue({ readIds: [] }),
  setTypingStatus: vi.fn().mockResolvedValue(null),
}))

import * as chatRoute from "@/app/api/chat/route"
import * as chatMessagesRoute from "@/app/api/chat/messages/route"
import * as chatReadRoute from "@/app/api/chat/read/route"
import * as chatTypingRoute from "@/app/api/chat/typing/route"

const mockedGetServerSession = vi.mocked(getServerSession)

function jsonRequest(method: string, body: unknown = {}) {
  return new Request("http://localhost/api/test", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

function asSession(role: string, id = "u1") {
  return {
    user: { id, name: "Teste", role },
  } as Awaited<ReturnType<typeof getServerSession>>
}

beforeEach(() => {
  mockedGetServerSession.mockResolvedValue(null)
})

describe("chat API — sem sessão → 401", () => {
  const cases: Array<[string, () => Promise<Response>]> = [
    ["GET /api/chat", () => chatRoute.GET(new Request("http://localhost/api/chat"))],
    ["POST /api/chat", () => chatRoute.POST(jsonRequest("POST", { participantIds: ["u2"] }))],
    [
      "GET /api/chat/messages",
      () =>
        chatMessagesRoute.GET(
          new Request("http://localhost/api/chat/messages?conversationId=1")
        ),
    ],
    [
      "POST /api/chat/messages",
      () => chatMessagesRoute.POST(jsonRequest("POST", { conversationId: 1, content: "oi" })),
    ],
    [
      "POST /api/chat/read",
      () => chatReadRoute.POST(jsonRequest("POST", { conversationId: 1 })),
    ],
    [
      "POST /api/chat/typing",
      () => chatTypingRoute.POST(jsonRequest("POST", { conversationId: 1, isTyping: true })),
    ],
  ]

  it.each(cases)("%s responde 401", async (_label, handler) => {
    const res = await handler()
    expect(res.status).toBe(401)
  })
})

describe("chat API — todos os papéis autenticados podem acessar", () => {
  it.each(["MEDICO", "ADMIN", "SUPER_ADMIN"] as const)(
    "GET /api/chat com papel %s → 200",
    async (role) => {
      mockedGetServerSession.mockResolvedValue(asSession(role))
      const res = await chatRoute.GET(new Request("http://localhost/api/chat"))
      expect(res.status).toBe(200)
    }
  )

  it("GET /api/chat?action=users lista usuários para nova conversa", async () => {
    mockedGetServerSession.mockResolvedValue(asSession("MEDICO"))
    const res = await chatRoute.GET(
      new Request("http://localhost/api/chat?action=users")
    )
    expect(res.status).toBe(200)
  })
})

describe("chat API — validação → 400", () => {
  beforeEach(() => {
    mockedGetServerSession.mockResolvedValue(asSession("ADMIN"))
  })

  it("POST /api/chat sem participantIds", async () => {
    const res = await chatRoute.POST(jsonRequest("POST", {}))
    expect(res.status).toBe(400)
  })

  it("GET /api/chat/messages sem conversationId", async () => {
    const res = await chatMessagesRoute.GET(
      new Request("http://localhost/api/chat/messages")
    )
    expect(res.status).toBe(400)
  })

  it("POST /api/chat/messages sem conversationId", async () => {
    const res = await chatMessagesRoute.POST(jsonRequest("POST", { content: "oi" }))
    expect(res.status).toBe(400)
  })
})
