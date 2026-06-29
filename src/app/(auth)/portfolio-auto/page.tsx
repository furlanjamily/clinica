"use client"

import { Suspense, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { toast } from "sonner"
import { fetchPortfolioCredentials } from "@/hooks/usePortfolioDemo"
import { PortfolioVisitorLoading } from "@/components/auth/portfolio-auto/PortfolioVisitorLoading"

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
        toast.error("Não foi possível carregar credenciais de demonstração.")
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

  return <PortfolioVisitorLoading />
}

export default function PortfolioAutoPage() {
  return (
    <Suspense fallback={<PortfolioVisitorLoading />}>
      <PortfolioAutoInner />
    </Suspense>
  )
}
