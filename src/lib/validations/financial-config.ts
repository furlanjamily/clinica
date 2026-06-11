import { z } from "zod"

export const UpdateFinancialConfigSchema = z.object({
  consultationFee: z.number().nonnegative().optional(),
  followUpFee: z.number().nonnegative().optional(),
  doctorCommissionRate: z.number().min(0).max(100).optional(),
})
