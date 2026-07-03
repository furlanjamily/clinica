import { z } from "zod"

const optionalString = z.string().nullish()

export const PatientSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(120),
  birthDate: optionalString,
  gender: optionalString,
  cpf: optionalString,
  phone: optionalString,
  email: optionalString,
  zipCode: optionalString,
  street: optionalString,
  number: optionalString,
  complement: optionalString,
  neighborhood: optionalString,
  city: optionalString,
  state: optionalString,
  insurancePlan: optionalString,
  insuranceNumber: optionalString,
  notes: optionalString,
  maritalStatus: optionalString,
  education: optionalString,
  religion: optionalString,
  profession: optionalString,
})

export const CreatePatientSchema = PatientSchema

export const UpdatePatientSchema = PatientSchema.partial().extend({
  id: z.number().int().positive(),
  image: z.string().url().nullable().optional(),
})

export const PatientAvatarUploadSchema = z.object({
  patientId: z.coerce.number().int().positive(),
})

export const DeletePatientSchema = z.object({
  id: z.number().int().positive(),
})
