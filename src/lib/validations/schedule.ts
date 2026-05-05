import { z } from "zod"
import { sanitizePhone, sanitizeName } from "@/lib/sanitization"

export const CreateAppointmentSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  horario: z.string().regex(/^\d{2}:\d{2}$/),

  paciente: z.union([
    z.string().transform(sanitizeName),
    z.object({
      id: z.number().optional(),
      nome: z.string().transform(sanitizeName),
    }),
  ]),

  profissional: z.union([
    z.string().transform(sanitizeName),
    z.object({
      id: z.number().optional(),
      nome: z.string().transform(sanitizeName),
    }),
  ]),

  telefone: z.string().transform(sanitizePhone).optional(),
})

export type CreateAppointment = z.infer<typeof CreateAppointmentSchema>
