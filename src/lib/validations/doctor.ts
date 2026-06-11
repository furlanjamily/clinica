import { z } from "zod"

const optionalString = z.string().nullish()

export const DoctorSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(120),
  crm: optionalString,
  specialty: optionalString,
  gender: optionalString,
  cpf: optionalString,
  birthDate: optionalString,
  phone: optionalString,
  email: optionalString,
  zipCode: optionalString,
  street: optionalString,
  number: optionalString,
  complement: optionalString,
  neighborhood: optionalString,
  city: optionalString,
  state: optionalString,
  notes: optionalString,
  shift: optionalString,
  active: z.boolean().optional(),
})

export const CreateDoctorSchema = DoctorSchema

export const UpdateDoctorSchema = DoctorSchema.partial().extend({
  id: z.number().int().positive(),
})

export const DeleteDoctorSchema = z.object({
  id: z.number().int().positive(),
})
