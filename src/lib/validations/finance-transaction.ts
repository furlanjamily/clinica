import { z } from "zod"

const categoriasReceitaAgendamento = ["Consulta", "Retorno"] as const

export const CreateTransacaoSchema = z.object({
  tipo: z.enum(["Receita", "Despesa"]),
  categoria: z.string().trim().min(1).max(120),
  descricao: z.string().min(1).max(500),
  valor: z.number().positive(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  formaPagamento: z
    .string()
    .max(80)
    .optional()
    .nullable()
    .transform((s) => (s?.trim() ? s.trim() : undefined)),
  status: z.string().default("Confirmado"),
  agendamentoId: z.number().int().positive().optional(),
})

export type CreateTransacaoInput = z.infer<typeof CreateTransacaoSchema>

export function isReceitaConsultaOuRetorno(categoria: string): boolean {
  return categoriasReceitaAgendamento.includes(categoria as (typeof categoriasReceitaAgendamento)[number])
}

export function valorCoerenteComTabela(
  categoria: string,
  valor: number,
  valorConsulta: number,
  valorRetorno: number
): { ok: true } | { ok: false; message: string } {
  const esperado = categoria === "Retorno" ? valorRetorno : valorConsulta
  const min = Math.max(esperado * 0.85, 1)
  const max = esperado * 1.15
  if (valor < min || valor > max) {
    return {
      ok: false,
      message: `Valor fora da faixa coerente com a tabela (${categoria}: entre ${min.toFixed(2)} e ${max.toFixed(2)} reais; referência ${esperado.toFixed(2)}). Ajuste o valor ou a categoria em Configurações financeiras.`,
    }
  }
  return { ok: true }
}
