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
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {}
  };

  return (
    <div className="flex min-h-dvh w-full flex-col bg-gray-100 lg:flex-row lg:justify-between lg:overflow-hidden">

      <div className="relative flex min-w-0 flex-1 flex-col justify-center px-6 pb-14 pt-28 sm:px-10 lg:px-[68px] lg:pb-12 lg:pt-16">
        <Image
          src="/logo.svg"
          alt="Logo"
          width={139}
          height={27}
          className="absolute left-6 top-8 sm:left-10 sm:top-9 lg:left-[68px] lg:top-9"
          priority
        />

        <div>
          <h1 className="pb-1 text-2xl font-bold text-secondary">Faça login</h1>
          <div className="pb-4">
            <p className="text-xs font-medium text-accent">Acesso apenas para administradores</p>
          </div>
        </div>

        <div className="w-full">
          <form onSubmit={handleSubmit(onSubmit)} className="flex w-full max-w-[350px] flex-col gap-2">
            <FormProvider {...singInForm}>
              <Input
                id="email"
                type="text"
                {...register("email")}
                className="h-[38px] w-full"
                error={errors.email?.message}
              />
              <Input
                id="password"
                type="password"
                {...register("password")}
                className="h-[38px] w-full"
                error={errors.password?.message}
              />

              <div className="flex flex-col gap-2 pt-4">
                <button
                  type="submit"
                  className="flex h-[32px] w-full items-center justify-center rounded-md bg-primary text-xs font-bold text-white"
                >
                  Entrar
                </button>
              </div>

            </FormProvider>
          </form>
        </div>
      </div>

      <div className="relative hidden min-h-dvh w-full flex-shrink-0 lg:block lg:w-[min(45vw,810px)] lg:max-w-[810px] lg:overflow-hidden">
        <Image
          src="/ImageSignIn.png"
          alt="Imagem de Login"
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 0px, min(45vw, 810px)"
          priority
        />
      </div>
    </div>
  );
}
