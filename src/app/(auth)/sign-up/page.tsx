"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import * as z from "zod"
import Link from "next/link"
import { toast } from "sonner"
import { Input } from "@/components/ui/Input"
import Image from "next/image"

const schema = z.object({
  username: z.string().min(1, "Digite seu nome.").max(100),
  email: z.string().min(1, "Digite seu email.").email("Email inválido."),
  password: z.string().min(8, "Senha precisa de no mínimo 8 caracteres."),
  confirmPassword: z.string().min(1, "Confirme sua senha."),
}).refine((d) => d.password === d.confirmPassword, {
  path: ["confirmPassword"],
  message: "As senhas não coincidem.",
})

type FormData = z.infer<typeof schema>

export default function SignUp() {
  const router = useRouter()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    const res = await fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: data.username,
        email: data.email,
        password: data.password,
      }),
    })

    if (res.ok) {
      toast.success("Conta criada com sucesso! Faça login.")
      router.push("/sign-in")
    } else {
      const body = await res.json()
      toast.error(body.message ?? "Erro ao cadastrar.")
    }
  }

  return (
    <div className="flex min-h-dvh w-full flex-col bg-gray-100 lg:flex-row lg:justify-between lg:overflow-hidden">

      <div className="relative flex min-w-0 flex-1 flex-col justify-center px-6 pb-14 pt-28 sm:px-10 lg:px-[68px] lg:pb-12 lg:pt-28">
        <Image
          src="/logo.svg"
          alt="Logo"
          width={139}
          height={27}
          className="absolute left-6 top-8 sm:left-10 sm:top-9 lg:left-[68px]"
          priority
        />

        <div className="mb-4">
          <h1 className="pb-1 text-2xl font-bold text-secondary">Criar conta</h1>
          <p className="text-xs font-medium text-accent">Preencha os dados para criar seu acesso</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex w-full max-w-[350px] flex-col gap-2">
          <Input
            label="Nome"
            type="text"
            placeholder="Seu nome completo"
            {...register("username")}
            className="h-[38px] w-full"
            error={errors.username?.message}
          />
          <Input
            label="Email"
            type="email"
            placeholder="seu@email.com"
            {...register("email")}
            className="h-[38px] w-full"
            error={errors.email?.message}
          />
          <Input
            label="Senha"
            type="password"
            placeholder="Mínimo 8 caracteres"
            {...register("password")}
            className="h-[38px] w-full"
            error={errors.password?.message}
          />
          <Input
            label="Confirmar senha"
            type="password"
            placeholder="Repita a senha"
            {...register("confirmPassword")}
            className="h-[38px] w-full"
            error={errors.confirmPassword?.message}
          />

          <div className="flex flex-col gap-2 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-[32px] w-full items-center justify-center rounded-md bg-primary text-xs font-bold text-white disabled:opacity-50"
            >
              {isSubmitting ? "Cadastrando..." : "Criar conta"}
            </button>

            <p className="text-center text-xs text-accent">
              Já tem conta?{" "}
              <Link href="/sign-in" className="font-medium text-primary hover:underline">
                Fazer login
              </Link>
            </p>
          </div>
        </form>
      </div>

      <div className="relative hidden min-h-dvh w-full flex-shrink-0 lg:block lg:w-[min(45vw,810px)] lg:max-w-[810px] lg:overflow-hidden">
        <Image
          src="/ImageSignIn.png"
          alt="Imagem de cadastro"
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 0px, min(45vw, 810px)"
          priority
        />
      </div>
    </div>
  )
}
