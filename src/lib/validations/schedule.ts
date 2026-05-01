import { z } from "zod"
import { sanitizeText, sanitizePhone, sanitizeName } from "@/lib/sanitization"

/* =========================
   BASE (SCHEDULE)
========================= */
export const AppointmentSchema = z.object({
  id: z.number(),

  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  horario: z.string().regex(/^\d{2}:\d{2}$/),

  atendimento: z.string(),

  paciente: z.string(),
  profissional: z.string(),

  status: z.string(),

  telefone: z.string().optional(),

  arrived: z.boolean().optional(),
  checkInTime: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  whatsappSent: z.boolean().optional(),
  accumulatedTime: z.number().optional(),
  pausedAt: z.string().optional(),
})

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

export type Appointment = z.infer<typeof AppointmentSchema>
export type CreateAppointment = z.infer<typeof CreateAppointmentSchema>