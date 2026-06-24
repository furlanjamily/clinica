"use client"

import { Suspense, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { toast } from "sonner"
import { fetchPortfolioCredentials } from "@/hooks/usePortfolioDemo"

function safeCallbackUrl(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard"
  return raw
}

function PortfolioAutoInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    void (async () => {
      const result = await fetchPortfolioCredentials()
      if (!result.ok) {
        toast.error(
          result.status === 404
            ? "Modo visitante desligado no servidor."
            : "Não foi possível carregar credenciais de demonstração."
        )
        router.replace("/sign-in")
        return
      }

      const { email, password } = result.credentials

      const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"))
      const signInData = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (signInData?.error) {
        toast.error("Não foi possível entrar como visitante.")
        router.replace("/sign-in")
        return
      }

      // Navegação completa: o cookie de sessão nem sempre acompanha router.replace + refresh.
      const path = callbackUrl.startsWith("http") ? callbackUrl : `${window.location.origin}${callbackUrl}`
      window.location.assign(path)
    })()
  }, [router, searchParams])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 bg-gray-100 px-4 text-center text-sm text-gray-600">
      <p className="font-medium text-gray-800">Entrando como visitante…</p>
      <p className="max-w-sm text-xs text-gray-500">Modo demonstração do portfólio</p>
    </div>
  )
}

export default function PortfolioAutoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center bg-gray-100 text-sm text-gray-600">
          Carregando…
        </div>
      }
    >
      <PortfolioAutoInner />
    </Suspense>
  )
}
