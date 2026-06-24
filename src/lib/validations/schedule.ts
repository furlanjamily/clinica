import { z } from "zod"
import { sanitizePhone, sanitizeName } from "@/lib/sanitization"
import { AppointmentStatus } from "@/lib/schedule/status"

const appointmentStatusValues = Object.values(AppointmentStatus) as [
  (typeof AppointmentStatus)[keyof typeof AppointmentStatus],
  ...(typeof AppointmentStatus)[keyof typeof AppointmentStatus][],
]

export const CreateAppointmentSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slotTime: z.string().regex(/^\d{2}:\d{2}$/),

  patient: z.union([
    z.string().transform(sanitizeName),
    z.object({
      id: z.number().optional(),
      name: z.string().transform(sanitizeName),
    }),
  ]),

  professional: z.union([
    z.string().transform(sanitizeName),
    z.object({
      id: z.number().optional(),
      name: z.string().transform(sanitizeName),
    }),
  ]),

  phone: z.string().transform(sanitizePhone).optional(),
})

export type CreateAppointmentInput = z.infer<typeof CreateAppointmentSchema>

export const UpdateAppointmentSchema = z.object({
  id: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  slotTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  horario: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  status: z.enum(appointmentStatusValues).optional(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  accumulatedTime: z.number().int().nonnegative().optional(),
  pausedAt: z.string().nullable().optional(),
})

export type UpdateAppointmentInput = z.infer<typeof UpdateAppointmentSchema>
