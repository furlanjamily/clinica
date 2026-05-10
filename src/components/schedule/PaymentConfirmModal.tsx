"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import type { Appointment } from "@/types/types"
import { ModalHeader } from "@/components/ui/ModalHeader"
import { Button } from "@/components/ui/button"
import { Input, FormSelect } from "@/components/ui/Input"

type FeeConfig = {
  consultationFee: number
  followUpFee: number
  doctorCommissionRate: number
}

const PAYMENT_METHODS = ["Dinheiro", "Cartão de Crédito", "Cartão de Débito", "Pix", "Convênio", "Transferência"]

type PaymentForm = {
  category: string
  amount: number
  description: string
  date: string
  paymentMethod: string
}

type Props = {
  item: Appointment
  onClose: () => void
  onSuccess: (updated: Appointment) => void
}

export function PaymentConfirmModal({ item, onClose, onSuccess }: Props) {
  const [feeConfig, setFeeConfig] = useState<FeeConfig | null>(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, reset, watch, setValue } = useForm<PaymentForm>({
    defaultValues: {
      category: "Consulta",
      amount: 0,
      description: "",
      date: new Date().toISOString().slice(0, 10),
      paymentMethod: "",
    },
  })

  const category = watch("category")

  useEffect(() => {
    let cancelled = false
    fetch("/api/finance/config")
      .then((r) => r.json())
      .then((c: FeeConfig) => {
        if (cancelled) return
        setFeeConfig(c)
      })
      .catch(() => toast.error("Não foi possível carregar a tabela de valores."))
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!feeConfig) return
    const patientLabel = item.patient?.name ?? item.patientName ?? "Paciente"
    reset({
      category: "Consulta",
      amount: feeConfig.consultationFee,
      description: `Receita — ${patientLabel} (${item.date} ${item.slotTime})`,
      date: new Date().toISOString().slice(0, 10),
      paymentMethod: "",
    })
  }, [item.id, item.date, item.slotTime, item.patient?.name ?? "", item.patientName ?? "", feeConfig, reset])

  useEffect(() => {
    if (!feeConfig) return
    setValue("amount", category === "Retorno" ? feeConfig.followUpFee : feeConfig.consultationFee)
  }, [category, feeConfig, setValue])

  async function onSubmit(data: PaymentForm) {
    setLoading(true)
    try {
      const res = await fetch("/api/finance/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "Receita",
          category: data.category,
          description: data.description.trim(),
          amount: data.amount,
          date: data.date,
          paymentMethod: data.paymentMethod,
          status: "Confirmado",
          appointmentId: item.id,
        }),
      })

      const body = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(body?.message ?? "Não foi possível registrar o pagamento.")
        return
      }

      const updated = body.appointment as Appointment
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
        {feeConfig && (
          <p className="mb-4 text-xs text-gray-500">
            Referência: consulta {feeConfig.consultationFee.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} ·
            retorno {feeConfig.followUpFee.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormSelect label="Tipo de atendimento" {...register("category")}>
            <option value="Consulta">Consulta</option>
            <option value="Retorno">Retorno</option>
          </FormSelect>
          <Input
            label="Valor (R$)"
            type="number"
            step="0.01"
            {...register("amount", { valueAsNumber: true, required: true })}
          />
          <Input label="Descrição" {...register("description", { required: true })} />
          <Input label="Data da transação" type="date" {...register("date", { required: true })} />
          <FormSelect label="Forma de pagamento" {...register("paymentMethod", { required: true })}>
            <option value="">Selecione</option>
            {PAYMENT_METHODS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </FormSelect>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !feeConfig}>
              {loading ? "Salvando..." : "Registrar e marcar como pago"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
