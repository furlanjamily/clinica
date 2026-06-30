"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn, getSession } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner"
import { Input } from "@/components/ui/Input"
import { SignInLayout } from "@/components/auth/sign-in/SignInLayout"
import { getDefaultRouteForRole } from "@/lib/auth/permissions";
import type { UserRoleType } from "@/types/auth";
import { SIGN_IN_INPUT_CLASS, SIGN_IN_SUBMIT_CLASS } from "@/components/auth/sign-in/sign-in-styles"

const signInSchema = z.object({
  email: z.string().min(1, "Digite seu email."),
  password: z.string().min(1, "Digite sua senha.").min(6, "A senha deve ter no mínimo 6 caracteres."),
});

type SignInFormData = z.infer<typeof signInSchema>;

export default function SignIn() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

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
        const session = await getSession()
        const role = (session?.user as { role?: UserRoleType } | undefined)?.role
        router.push(getDefaultRouteForRole(role))
        router.refresh();
      }
    } catch (error) {}
  };

  const handleVisitorSignIn = () => {
    router.push("/portfolio-auto?callbackUrl=/dashboard");
  };

  return (
    <SignInLayout onVisitorSignIn={handleVisitorSignIn}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex w-full flex-col gap-4">
        <FormProvider {...singInForm}>
          <Input
            id="email"
            label="Email"
            type="text"
            placeholder="seu@email.com"
            {...register("email")}
            className={SIGN_IN_INPUT_CLASS}
            error={errors.email?.message}
          />
          <Input
            id="password"
            label="Senha"
            placeholder="••••••••"
            {...register("password")}
            type={showPassword ? "text" : "password"}
            className={SIGN_IN_INPUT_CLASS}
            error={errors.password?.message}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                className="flex items-center justify-center text-accent transition-colors hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
              >
                {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            }
          />

          <div className="pt-2">
            <button
              type="submit"
              aria-label="Entrar"
              className={SIGN_IN_SUBMIT_CLASS}
            >
              Entrar
            </button>
          </div>
        </FormProvider>
      </form>
    </SignInLayout>
  );
}
