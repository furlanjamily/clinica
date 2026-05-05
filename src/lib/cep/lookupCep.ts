export type ViaCepSuccess = {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
}

export function cepDigits(cep: string | null | undefined): string {
  return (cep ?? "").replace(/\D/g, "")
}

/** CEP no formato 00000-000 a partir de 8 dígitos. */
export function formatCepMaskedFromDigits(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 8)
  if (d.length <= 5) return d
  return `${d.slice(0, 5)}-${d.slice(5)}`
}

/** Campos preenchíveis automaticamente pelo ViaCEP (número e complemento ficam manuais). */
export function viaCepAddressAutoFill(data: ViaCepSuccess, digits8: string) {
  return {
    cep: formatCepMaskedFromDigits(digits8),
    logradouro: data.logradouro ?? "",
    bairro: data.bairro ?? "",
    cidade: data.localidade ?? "",
    uf: (data.uf ?? "").toUpperCase().slice(0, 2),
  }
}

/** Monta uma linha de endereço legível a partir da resposta do ViaCEP. */
export function enderecoLineFromViaCep(data: ViaCepSuccess): string {
  const cidadeUf = [data.localidade, data.uf].filter(Boolean).join(" - ")
  return [data.logradouro, data.bairro, cidadeUf].filter(Boolean).join(" - ")
}

export type LookupCepResult =
  | { ok: true; data: ViaCepSuccess; enderecoLine: string }
  | { ok: false; reason: "invalid" | "not_found" | "network" }

export async function lookupCep(cepMaskedOrDigits: string | null | undefined): Promise<LookupCepResult> {
  const d = cepDigits(cepMaskedOrDigits)
  if (d.length !== 8) return { ok: false, reason: "invalid" }

  try {
    const res = await fetch(`https://viacep.com.br/ws/${d}/json/`)
    if (!res.ok) return { ok: false, reason: "network" }
    const json = (await res.json()) as ViaCepSuccess & { erro?: true }
    if (json.erro) return { ok: false, reason: "not_found" }
    const data = json as ViaCepSuccess
    return { ok: true, data, enderecoLine: enderecoLineFromViaCep(data) }
  } catch {
    return { ok: false, reason: "network" }
  }
}
