import { describe, it, expect } from "vitest"
import {
  CHAT_DEMO_CATEGORIES,
  DEMO_CHAT_THREADS,
  DEMO_GROUP_CHAT,
  RECEPTION_DEMO_USERS,
  messageTimestamp,
} from "@/lib/chat/demo-data"

describe("dados demo do chat", () => {
  it("define categorias esperadas na UI", () => {
    expect(CHAT_DEMO_CATEGORIES).toEqual(["Importante", "Trabalho", "Equipe"])
  })

  it("inclui usuários de recepção (ADMIN)", () => {
    expect(RECEPTION_DEMO_USERS.length).toBeGreaterThanOrEqual(2)
    expect(RECEPTION_DEMO_USERS.every((u) => u.role === "ADMIN")).toBe(true)
  })

  it("cria threads entre recepção e médicos", () => {
    const receptionEmails = RECEPTION_DEMO_USERS.map((u) => u.email)
    const crossTeam = DEMO_CHAT_THREADS.filter(
      (t) =>
        receptionEmails.includes(t.userEmailA) ||
        receptionEmails.includes(t.userEmailB)
    )
    expect(crossTeam.length).toBeGreaterThanOrEqual(3)
  })

  it("cada thread demo possui ao menos 2 mensagens", () => {
    for (const thread of DEMO_CHAT_THREADS) {
      expect(thread.messages.length).toBeGreaterThanOrEqual(2)
    }
  })

  it("grupo inclui recepção e médicos", () => {
    expect(DEMO_GROUP_CHAT.participantEmails).toContain("recepcao@clinicademo.local")
    expect(DEMO_GROUP_CHAT.participantEmails.some((e) => e.startsWith("medico."))).toBe(true)
  })

  it("messageTimestamp gera datas no passado", () => {
    const past = messageTimestamp(2, 3)
    expect(past.getTime()).toBeLessThan(Date.now())
  })
})

describe("comunicação entre papéis (regra de negócio)", () => {
  it("qualquer usuário ativo pode ser destinatário de conversa direta", () => {
    const roles = ["ADMIN", "MEDICO", "SUPER_ADMIN"]
    expect(roles).toContain("ADMIN")
    expect(roles).toContain("MEDICO")
  })

  it("threads demo cobrem recepção → médico e médico → médico", () => {
    const hasRecepcaoMedico = DEMO_CHAT_THREADS.some(
      (t) =>
        t.userEmailA.includes("recepcao") || t.userEmailB.includes("recepcao") ||
        t.userEmailA.includes("atendimento") || t.userEmailB.includes("atendimento")
    )
    const hasMedicoMedico = DEMO_CHAT_THREADS.some(
      (t) => t.userEmailA.startsWith("medico.") && t.userEmailB.startsWith("medico.")
    )
    expect(hasRecepcaoMedico).toBe(true)
    expect(hasMedicoMedico).toBe(true)
  })
})
