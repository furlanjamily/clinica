"use client"

import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
  type UseFormGetValues,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form"
import { toast } from "sonner"
import { Input } from "@/components/ui/Input"
import type { StreetAddress } from "@/types"
import { cepDigits, lookupCep, viaCepAddressAutoFill } from "@/lib/cep/lookupCep"

type WithStructuredAddress = FieldValues & StreetAddress

type CepEnderecoBlockProps<T extends WithStructuredAddress> = {
  control: Control<T>
  register: UseFormRegister<T>
  setValue: UseFormSetValue<T>
  getValues: UseFormGetValues<T>
}

export function CepEnderecoBlock<T extends WithStructuredAddress>({
  control,
  register,
  setValue,
  getValues,
}: CepEnderecoBlockProps<T>) {
  const opts = { shouldDirty: true, shouldValidate: true } as const

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Controller
        name={"cep" as Path<T>}
        control={control}
        render={({ field }) => (
          <Input
            mask="cep"
            label="CEP"
            placeholder="00000-000"
            {...field}
            value={field.value ?? ""}
            onBlur={() => {
              field.onBlur()
              void (async () => {
                const digits = cepDigits(field.value)
                if (digits.length !== 8) return
                const r = await lookupCep(field.value)
                if (!r.ok) {
                  if (r.reason === "not_found") toast.error("CEP não encontrado.")
                  else toast.error("Não foi possível buscar o CEP. Tente de novo.")
                  return
                }
                const patch = viaCepAddressAutoFill(r.data, digits)
                setValue("cep" as Path<T>, patch.cep as never, opts)
                setValue("logradouro" as Path<T>, patch.logradouro as never, opts)
                setValue("bairro" as Path<T>, patch.bairro as never, opts)
                setValue("cidade" as Path<T>, patch.cidade as never, opts)
                setValue("uf" as Path<T>, patch.uf as never, opts)
                if (r.data.complemento) {
                  const cur = getValues("complemento" as Path<T>)
                  if (cur == null || String(cur).trim() === "") {
                    setValue("complemento" as Path<T>, r.data.complemento as never, opts)
                  }
                }
                toast.success("Endereço preenchido pelo CEP.")
              })()
            }}
          />
        )}
      />
      <div className="sm:col-span-2">
        <Input label="Logradouro" {...register("logradouro" as Path<T>)} placeholder="Rua, avenida..." />
      </div>
      <Input label="Número" {...register("numero" as Path<T>)} placeholder="Nº" />
      <Input label="Complemento" {...register("complemento" as Path<T>)} placeholder="Apto, bloco, sala..." />
      <Input label="Bairro" {...register("bairro" as Path<T>)} placeholder="Bairro" />
      <Input label="Cidade" {...register("cidade" as Path<T>)} placeholder="Cidade" />
      <Input label="UF" maxLength={2} {...register("uf" as Path<T>)} placeholder="SP" />
    </div>
  )
}
