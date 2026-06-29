// @vitest-environment node
/**
 * Testa a proteção das rotas de API chamando os handlers diretamente,
 * com `next-auth` e o Prisma mockados. Sem sessão → 401; com papel
 * insuficiente → 403; payload inválido → 400 (antes de tocar o banco).
 */
import { getServerSession } from "next-auth"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/db", () => ({ db: {}, prisma: {} }))

import * as patientRoute from "@/app/api/patient/route"
import * as doctorRoute from "@/app/api/doctor/route"
import * as medicalRecordRoute from "@/app/api/medical-record/route"
import * as financeConfigRoute from "@/app/api/finance/config/route"
import * as financeTransactionsRoute from "@/app/api/finance/transactions/route"
import * as userRoute from "@/app/api/user/route"
import * as userAvatarRoute from "@/app/api/user/avatar/route"

const mockedGetServerSession = vi.mocked(getServerSession)

function jsonRequest(method: string, body: unknown = {}) {
  return new Request("http://localhost/api/test", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

function asSession(role: string) {
  return { user: { id: "u1", role } } as Awaited<ReturnType<typeof getServerSession>>
}

beforeEach(() => {
  mockedGetServerSession.mockResolvedValue(null)
})

describe("sem sessão → 401", () => {
  const cases: Array<[string, () => Promise<Response>]> = [
    ["GET /api/patient", () => patientRoute.GET()],
    ["POST /api/patient", () => patientRoute.POST(jsonRequest("POST", { name: "X" }))],
    ["PATCH /api/patient", () => patientRoute.PATCH(jsonRequest("PATCH", { id: 1 }))],
    ["DELETE /api/patient", () => patientRoute.DELETE(jsonRequest("DELETE", { id: 1 }))],
    ["GET /api/doctor", () => doctorRoute.GET()],
    ["POST /api/doctor", () => doctorRoute.POST(jsonRequest("POST", { name: "X" }))],
    ["GET /api/medical-record", () => medicalRecordRoute.GET()],
    ["POST /api/medical-record", () => medicalRecordRoute.POST(jsonRequest("POST", { appointmentId: 1 }))],
    ["GET /api/finance/config", () => financeConfigRoute.GET()],
    ["PATCH /api/finance/config", () => financeConfigRoute.PATCH(jsonRequest("PATCH", {}))],
    ["GET /api/finance/transactions", () => financeTransactionsRoute.GET(new Request("http://localhost/api/finance/transactions"))],
    ["POST /api/finance/transactions", () => financeTransactionsRoute.POST(jsonRequest("POST", {}))],
    ["GET /api/user", () => userRoute.GET()],
    ["POST /api/user/avatar", () => userAvatarRoute.POST(new Request("http://localhost/api/user/avatar", { method: "POST" }))],
  ]

  it.each(cases)("%s responde 401 com { message }", async (_label, handler) => {
    const res = await handler()
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body).toHaveProperty("message")
  })
})

describe("papel insuficiente → 403", () => {
  it("POST /api/doctor exige ADMIN ou SUPER_ADMIN", async () => {
    mockedGetServerSession.mockResolvedValue(asSession("MEDICO"))
    const res = await doctorRoute.POST(jsonRequest("POST", { name: "Dr(a). X" }))
    expect(res.status).toBe(403)
  })

  it("GET /api/user exige SUPER_ADMIN ou ADMIN", async () => {
    mockedGetServerSession.mockResolvedValue(asSession("MEDICO"))
    const res = await userRoute.GET()
    expect(res.status).toBe(403)
  })
})

describe("payload inválido → 400 (validação antes do banco)", () => {
  beforeEach(() => {
    mockedGetServerSession.mockResolvedValue(asSession("SUPER_ADMIN"))
  })

  it("POST /api/patient sem nome", async () => {
    const res = await patientRoute.POST(jsonRequest("POST", { phone: "11999999999" }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.message).toBe("Dados inválidos")
    expect(body.details).toBeTruthy()
  })

  it("PATCH /api/patient sem id", async () => {
    const res = await patientRoute.PATCH(jsonRequest("PATCH", { name: "Maria" }))
    expect(res.status).toBe(400)
  })

  it("POST /api/medical-record sem appointmentId", async () => {
    const res = await medicalRecordRoute.POST(jsonRequest("POST", { clinicalDiagnosis: "x" }))
    expect(res.status).toBe(400)
  })

  it("PATCH /api/finance/config com comissão acima de 100%", async () => {
    const res = await financeConfigRoute.PATCH(
      jsonRequest("PATCH", { doctorCommissionRate: 250 })
    )
    expect(res.status).toBe(400)
  })

  it("POST /api/user com senha curta", async () => {
    const res = await userRoute.POST(
      jsonRequest("POST", { name: "X", email: "x@x.com", password: "123", role: "ADMIN" })
    )
    expect(res.status).toBe(400)
  })
})
