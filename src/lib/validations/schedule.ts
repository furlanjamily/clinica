import { z } from "zod"
import { sanitizePhone, sanitizeName } from "@/lib/sanitization"

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
