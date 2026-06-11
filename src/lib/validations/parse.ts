import type { z } from "zod"
import { ValidationError } from "@/lib/errors/custom-errors"

/**
 * Valida `data` com o schema informado e lança `ValidationError`
 * (tratada por `handleApiError`) em caso de payload inválido.
 */
export function parseWith<Schema extends z.ZodTypeAny>(
  schema: Schema,
  data: unknown
): z.infer<Schema> {
  const parsed = schema.safeParse(data)
  if (!parsed.success) {
    throw new ValidationError("Dados inválidos", parsed.error.issues)
  }
  return parsed.data
}
