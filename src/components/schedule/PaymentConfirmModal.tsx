"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import type { Atendimento } from "@/types/types"
import { ModalHeader } from "@/components/ui/ModalHeader"
import { Button } from "@/components/ui/button"
import { Input, FormSelect } from "@/components/ui/Input"

type Config = {
  valorConsulta: number
  valorRetorno: number
  comissaoMedico: number
}

const FORMAS = ["Dinheiro", "Cartão de Crédito", "Cartão de Débito", "Pix", "Convênio", "Transferência"]

type Form = {
  categoria: string
  valor: number
  descricao: string
  data: string
  formaPagamento: string
}

type Props = {
  item: Atendimento
  onClose: () => void
  onSuccess: (updated: Atendimento) => void
}

export function PaymentConfirmModal({ item, onClose, onSuccess }: Props) {
  const [config, setConfig] = useState<Config | null>(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, reset, watch, setValue } = useForm<Form>({
    defaultValues: {
      categoria: "Consulta",
      valor: 0,
      descricao: "",
      data: new Date().toISOString().slice(0, 10),
      formaPagamento: "",
    },
  })

  const categoria = watch("categoria")

  useEffect(() => {
    let cancelled = false
    fetch("/api/finance/config")
      .then((r) => r.json())
      .then((c: Config) => {
        if (cancelled) return
        setConfig(c)
      })
      .catch(() => toast.error("Não foi possível carregar a tabela de valores."))
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!config) return
    const nome = item.paciente?.nome ?? item.pacienteNome ?? "Paciente"
    reset({
      categoria: "Consulta",
      valor: config.valorConsulta,
      descricao: `Receita — ${nome} (${item.data} ${item.horario})`,
      data: new Date().toISOString().slice(0, 10),
      formaPagamento: "",
    })
  }, [item.id, item.data, item.horario, item.paciente?.nome ?? "", item.pacienteNome ?? "", config, reset])

  useEffect(() => {
    if (!config) return
    setValue("valor", categoria === "Retorno" ? config.valorRetorno : config.valorConsulta)
  }, [categoria, config, setValue])

  async function onSubmit(data: Form) {
    setLoading(true)
    try {
      const res = await fetch("/api/finance/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "Receita",
          categoria: data.categoria,
          descricao: data.descricao.trim(),
          valor: data.valor,
          data: data.data,
          formaPagamento: data.formaPagamento,
          status: "Confirmado",
          agendamentoId: item.id,
        }),
      })

      const body = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(body?.message ?? "Não foi possível registrar o pagamento.")
        return
      }

      const updated = body.agendamento as Atendimento
      toast.success("Pagamento registrado. Status atualizado para pago.")
      onSuccess(updated)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div className="max-h-[min(92vh,40rem)] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-4 shadow-lg sm:rounded-xl sm:p-6">
        <ModalHeader title="Confirmar pagamento" onClose={onClose} />
        <p className="mb-4 text-sm leading-relaxed text-gray-600">
          Registre a receita vinculada a este agendamento. O valor deve estar na faixa de ±15% da tabela da clínica
          (consulta ou retorno) e o status da transação será <strong>Confirmado</strong>, liberando a etapa «Atender».
        </p>
        {config && (
          <p className="mb-4 text-xs text-gray-500">
            Referência: consulta {config.valorConsulta.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} ·
            retorno {config.valorRetorno.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormSelect label="Tipo de atendimento" {...register("categoria")}>
            <option value="Consulta">Consulta</option>
            <option value="Retorno">Retorno</option>
          </FormSelect>
          <Input
            label="Valor (R$)"
            type="number"
            step="0.01"
            {...register("valor", { valueAsNumber: true, required: true })}
          />
          <Input label="Descrição" {...register("descricao", { required: true })} />
          <Input label="Data da transação" type="date" {...register("data", { required: true })} />
          <FormSelect label="Forma de pagamento" {...register("formaPagamento", { required: true })}>
            <option value="">Selecione</option>
            {FORMAS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </FormSelect>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !config}>
              {loading ? "Salvando..." : "Registrar e marcar como pago"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
