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
    <div className="flex w-screen bg-gray-100 justify-between">
      <div className="flex flex-col justify-center items-start px-[68px] pt-[107px]">
        <Image src="/logo.svg" alt="Logo" width={139} height={27} className="absolute top-9 left-10 w-[139px] h-[27px]" />

        <div className="mb-4">
          <h1 className="text-2xl font-bold text-secondary pb-1">Criar conta</h1>
          <p className="font-medium text-xs text-accent">Preencha os dados para criar seu acesso</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
          <Input
            label="Nome"
            type="text"
            placeholder="Seu nome completo"
            {...register("username")}
            className="w-[280px] h-[38px]"
            error={errors.username?.message}
          />
          <Input
            label="Email"
            type="email"
            placeholder="seu@email.com"
            {...register("email")}
            className="w-[280px] h-[38px]"
            error={errors.email?.message}
          />
          <Input
            label="Senha"
            type="password"
            placeholder="Mínimo 8 caracteres"
            {...register("password")}
            className="w-[280px] h-[38px]"
            error={errors.password?.message}
          />
          <Input
            label="Confirmar senha"
            type="password"
            placeholder="Repita a senha"
            {...register("confirmPassword")}
            className="w-[280px] h-[38px]"
            error={errors.confirmPassword?.message}
          />

          <div className="pt-4 flex flex-col gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-[280px] h-[32px] bg-primary text-white rounded-md font-bold text-[10px] disabled:opacity-50"
            >
              {isSubmitting ? "Cadastrando..." : "Criar conta"}
            </button>

            <p className="text-xs text-accent text-center">
              Já tem conta?{" "}
              <Link href="/sign-in" className="text-primary font-medium hover:underline">
                Fazer login
              </Link>
            </p>
          </div>
        </form>
      </div>

      <div className="w-[810px] justify-end flex overflow-hidden">
        <Image src="/ImageSignIn.png" alt="Imagem de cadastro" width={400} height={300} />
      </div>
    </div>
  )
}
