"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner"
import { Input } from "@/components/ui/Input"
import Image from "next/image"

const signInSchema = z.object({
  email: z.string().min(1, "Digite seu email."),
  password: z.string().min(1, "Digite sua senha.").min(6, "A senha deve ter no mínimo 6 caracteres."),
});

type SignInFormData = z.infer<typeof signInSchema>;

export default function SignIn() {
  const router = useRouter();

  const singInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = singInForm;

  const onSubmit = async (data: SignInFormData) => {
    try {
      const signInData = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInData?.error) {
        toast.error("Email ou senha incorretos.")
      } else {
        toast.success("Login realizado com sucesso!")
        window.location.href = "/dashboard";
      }
    } catch (error) {
      toast.error("Ocorreu um erro. Tente novamente.")
    }
  };

  const onError = () => {
    // erros de validação já são exibidos inline nos campos
  };

  return (
    <div className="flex w-screen bg-gray-100 justify-between">
      

      <div className="flex flex-col justify-center items-start px-[68px] pt-[107px]">
<Image src="/logo.svg" alt="Logo" width={139} height={27} className="absolute top-9 left-10 w-[139px] h-[27px]" />

        <div>
        <h1 className="text-2xl font-bold text-secondary pb-1">Faça login</h1>
        <div className="pb-4">
        <p className="font-medium text-xs text-accent ">Acesso apenas para administradores</p>
        <p className="font-medium text-xs text-accent">Consulte sua conta com seu diretor</p>
        </div>
        </div>

        <div>
        <form onSubmit={handleSubmit(onSubmit, onError)} className="w-full max-w-[350px] flex flex-col gap-2">
          <FormProvider {...singInForm}>
            <Input
              id="email"
              type="text"
              {...register("email")}
              className="w-[280px] h-[38px]"
              error={errors.email?.message}
            />
            <Input
              id="password"
              type="password"
              {...register("password")}
              className="w-[280px] h-[38px]"
              error={errors.password?.message}
            />
              
            <div className="pt-4 flex flex-col gap-2">
            <button type="submit" className="w-[280px] h-[32px] bg-primary text-white rounded-md justify-center items-center font-bold size-[10px]">
              Entrar
            </button>

            <p className="text-xs text-accent text-center">
              Não tem conta?{" "}
              <a href="/sign-up" className="text-primary font-medium hover:underline">
                Cadastre-se
              </a>
            </p>
            </div>

          </FormProvider>
        </form>
        </div>
      </div>

      <div className="w-[810px] justify-end flex overflow-hidden">
        <Image src="/ImageSignIn.png" alt="Imagem de Login" width={400} height={300} className="" />
      </div>
    </div>
  );
}  