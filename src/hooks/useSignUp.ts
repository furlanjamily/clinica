"use client"

import { toast } from "sonner"
import { absoluteUrl } from "@/lib/absolute-url"

type SignUpInput = {
  name: string
  email: string
  password: string
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json()
    return body?.message ?? fallback
  } catch {
    return fallback
  }
}

export function useSignUp() {
  async function registerAccount(data: SignUpInput): Promise<boolean> {
    const res = await fetch(absoluteUrl("/api/user"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      toast.success("Conta criada com sucesso! Faça login.")
      return true
    }

    toast.error(await readErrorMessage(res, "Erro ao cadastrar."))
    return false
  }

  return { registerAccount }
}
