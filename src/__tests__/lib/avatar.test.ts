// @vitest-environment node
import { getInitials } from "@/lib/avatar/initials"
import { getAvatarColor } from "@/lib/avatar/colors"
import { CreateUserSchema, UpdateUserSchema } from "@/lib/validations/user"

describe("getInitials", () => {
  it("retorna iniciais do primeiro e último nome", () => {
    expect(getInitials("João Silva")).toBe("JS")
  })

  it("retorna a primeira letra para nome único", () => {
    expect(getInitials("Maria")).toBe("M")
  })

  it("retorna ? quando nome ausente", () => {
    expect(getInitials(null)).toBe("?")
    expect(getInitials("")).toBe("?")
  })
})

describe("getAvatarColor", () => {
  it("mantém cor consistente para o mesmo nome", () => {
    const first = getAvatarColor("João Silva")
    const second = getAvatarColor("João Silva")
    expect(first).toEqual(second)
  })

  it("pode variar entre nomes diferentes", () => {
    const a = getAvatarColor("Ana")
    const b = getAvatarColor("Bruno")
    expect(a.background).toBeTruthy()
    expect(b.background).toBeTruthy()
  })
})

describe("CreateUserSchema", () => {
  it("aceita image opcional", () => {
    const result = CreateUserSchema.safeParse({
      name: "Admin",
      email: "admin@clinica.com",
      password: "12345678",
      role: "ADMIN",
      image: null,
    })
    expect(result.success).toBe(true)
  })
})

describe("UpdateUserSchema", () => {
  it("permite remover image com null", () => {
    const result = UpdateUserSchema.safeParse({ id: "u1", image: null })
    expect(result.success).toBe(true)
  })
})
