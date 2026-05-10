import { z } from "zod"

const consultOrFollowUpCategories = ["Consulta", "Retorno"] as const

export const CreateTransactionSchema = z.object({
  type: z.enum(["Receita", "Despesa"]),
  category: z.string().trim().min(1).max(120),
  description: z.string().min(1).max(500),
  amount: z.number().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  paymentMethod: z
    .string()
    .max(80)
    .optional()
    .nullable()
    .transform((s) => (s?.trim() ? s.trim() : undefined)),
  status: z.string().default("Confirmado"),
  appointmentId: z.number().int().positive().optional(),
})

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>

export function isConsultOrFollowUpCategory(category: string): boolean {
  return consultOrFollowUpCategories.includes(
    category as (typeof consultOrFollowUpCategories)[number]
  )
}

export function amountMatchesFeeTable(
  category: string,
  amount: number,
  consultationFee: number,
  followUpFee: number
): { ok: true } | { ok: false; message: string } {
  const expected = category === "Retorno" ? followUpFee : consultationFee
  const min = Math.max(expected * 0.85, 1)
  const max = expected * 1.15
  if (amount < min || amount > max) {
    return {
      ok: false,
      message: `Valor fora da faixa coerente com a tabela (${category}: entre ${min.toFixed(2)} e ${max.toFixed(2)} reais; referência ${expected.toFixed(2)}). Ajuste o valor ou a categoria em Configurações financeiras.`,
    }
  }
  return { ok: true }
}
