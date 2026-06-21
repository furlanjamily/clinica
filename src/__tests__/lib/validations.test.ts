// @vitest-environment node
import {
  CreatePatientSchema,
  UpdatePatientSchema,
  DeletePatientSchema,
} from "@/lib/validations/patient"
import { CreateDoctorSchema, UpdateDoctorSchema } from "@/lib/validations/doctor"
import {
  CreateMedicalRecordSchema,
  UpdateMedicalRecordSchema,
} from "@/lib/validations/medical-record"
import { UpdateFinancialConfigSchema } from "@/lib/validations/financial-config"
import { parseWith } from "@/lib/validations/parse"
import { ValidationError } from "@/lib/errors/custom-errors"

describe("CreatePatientSchema", () => {
  it("aceita paciente válido apenas com nome", () => {
    const result = CreatePatientSchema.safeParse({ name: "Maria Silva" })
    expect(result.success).toBe(true)
  })

  it("rejeita paciente sem nome", () => {
    expect(CreatePatientSchema.safeParse({}).success).toBe(false)
    expect(CreatePatientSchema.safeParse({ name: "   " }).success).toBe(false)
  })

  it("remove campos desconhecidos (proteção contra mass assignment)", () => {
    const result = CreatePatientSchema.parse({
      name: "Maria",
      isAdmin: true,
      id: 999,
    } as Record<string, unknown>)

    expect(result).not.toHaveProperty("isAdmin")
    expect(result).not.toHaveProperty("id")
  })

  it("aceita campos opcionais nulos ou ausentes", () => {
    const result = CreatePatientSchema.safeParse({
      name: "Maria",
      cpf: null,
      email: undefined,
      phone: "",
    })
    expect(result.success).toBe(true)
  })
})

describe("UpdatePatientSchema / DeletePatientSchema", () => {
  it("exige id numérico positivo para atualizar", () => {
    expect(UpdatePatientSchema.safeParse({ id: 1, name: "Novo" }).success).toBe(true)
    expect(UpdatePatientSchema.safeParse({ name: "Sem id" }).success).toBe(false)
    expect(UpdatePatientSchema.safeParse({ id: -5 }).success).toBe(false)
  })

  it("exige id para remover", () => {
    expect(DeletePatientSchema.safeParse({ id: 10 }).success).toBe(true)
    expect(DeletePatientSchema.safeParse({}).success).toBe(false)
    expect(DeletePatientSchema.safeParse({ id: "abc" }).success).toBe(false)
  })
})

describe("Doctor schemas", () => {
  it("aceita médico válido e rejeita sem nome", () => {
    expect(CreateDoctorSchema.safeParse({ name: "Dr(a). João", active: true }).success).toBe(true)
    expect(CreateDoctorSchema.safeParse({ crm: "12345" }).success).toBe(false)
  })

  it("update parcial só exige o id", () => {
    expect(UpdateDoctorSchema.safeParse({ id: 3, shift: "Manhã" }).success).toBe(true)
    expect(UpdateDoctorSchema.safeParse({ shift: "Manhã" }).success).toBe(false)
  })
})

describe("MedicalRecord schemas", () => {
  it("exige appointmentId positivo na criação", () => {
    expect(
      CreateMedicalRecordSchema.safeParse({
        appointmentId: 1,
        clinicalDiagnosis: "Diagnóstico",
      }).success
    ).toBe(true)
    expect(CreateMedicalRecordSchema.safeParse({ clinicalDiagnosis: "x" }).success).toBe(false)
    expect(CreateMedicalRecordSchema.safeParse({ appointmentId: 0 }).success).toBe(false)
  })

  it("exige id na atualização", () => {
    expect(UpdateMedicalRecordSchema.safeParse({ id: 7, psychicExam: "ok" }).success).toBe(true)
    expect(UpdateMedicalRecordSchema.safeParse({ psychicExam: "ok" }).success).toBe(false)
  })
})

describe("UpdateFinancialConfigSchema", () => {
  it("aceita valores válidos", () => {
    expect(
      UpdateFinancialConfigSchema.safeParse({
        consultationFee: 150,
        followUpFee: 80,
        doctorCommissionRate: 40,
      }).success
    ).toBe(true)
  })

  it("rejeita valores negativos e comissão acima de 100%", () => {
    expect(UpdateFinancialConfigSchema.safeParse({ consultationFee: -1 }).success).toBe(false)
    expect(UpdateFinancialConfigSchema.safeParse({ doctorCommissionRate: 150 }).success).toBe(false)
  })
})

describe("parseWith", () => {
  it("retorna os dados quando válidos", () => {
    const data = parseWith(DeletePatientSchema, { id: 1 })
    expect(data).toEqual({ id: 1 })
  })

  it("lança ValidationError com os issues quando inválido", () => {
    try {
      parseWith(DeletePatientSchema, { id: "x" })
      expect.unreachable("deveria ter lançado ValidationError")
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError)
      expect((error as ValidationError).details).toBeTruthy()
    }
  })
})
