"use client"

import { useEffect, useState, type ChangeEvent } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Plus, Trash2, Settings, TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import { TableSkeleton } from "@/components/ui/TableSkeleton"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/ui/PageHeader"
import { ModalHeader } from "@/components/ui/ModalHeader"
import { Input, FormSelect } from "@/components/ui/Input"
import { DESPESA_CATEGORIAS, RECEITA_CATEGORIAS } from "@/lib/finance/categories"

type Transacao = {
  id: number
  type: "Receita" | "Despesa"
  category: string
  description: string
  amount: number
  date: string
  paymentMethod?: string | null
  status: string
}

type Config = {
  consultationFee: number
  followUpFee: number
  doctorCommissionRate: number
}

const FORMAS_PAGAMENTO = ["Dinheiro", "Cartão de Crédito", "Cartão de Débito", "Pix", "Convênio", "Transferência", "Boleto", "Não aplicável"]

export default function FinancePage() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [config, setConfig] = useState<Config>({ consultationFee: 150, followUpFee: 80, doctorCommissionRate: 40 })
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [mes, setMes] = useState(new Date().toISOString().slice(0, 7))
  const [tipoFiltro, setTipoFiltro] = useState("")

  const { register, handleSubmit, reset, watch } = useForm<Omit<Transacao, "id">>({
    defaultValues: {
      type: "Receita",
      status: "Confirmado",
      date: new Date().toISOString().slice(0, 10),
      category: "",
      description: "",
      amount: 0,
      paymentMethod: "",
    },
  })
  const { register: regConfig, handleSubmit: handleConfig, reset: resetConfig } = useForm<Config>()

  const typeWatch = watch("type")

  useEffect(() => {
    Promise.all([
      fetch(`/api/finance/transactions?mes=${mes}${tipoFiltro ? `&tipo=${tipoFiltro}` : ""}`).then(r => r.json()),
      fetch("/api/finance/config").then(r => r.json()),
    ]).then(([t, c]) => {
      setTransacoes(Array.isArray(t) ? t : [])
      setConfig(c)
      resetConfig(c)
      setLoading(false)
    })
  }, [mes, tipoFiltro, resetConfig])

  async function handleSave(data: Omit<Transacao, "id">) {
    const res = await fetch("/api/finance/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const body = await res.json()
    if (!res.ok) {
      toast.error(body?.message ?? "Não foi possível registrar.")
      return
    }
    const nova = body.transaction ?? body.transacao ?? body
    setTransacoes((prev) => [nova, ...prev])
    toast.success("Transação registrada!")
    setShowModal(false)
    reset({
      type: "Receita",
      status: "Confirmado",
      date: new Date().toISOString().slice(0, 10),
      category: "",
      description: "",
      amount: 0,
      paymentMethod: "",
    })
  }

  async function handleDelete(id: number) {
    await fetch("/api/finance/transactions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    setTransacoes(prev => prev.filter(t => t.id !== id))
    toast.success("Transação removida.")
  }

  async function handleSaveConfig(data: Config) {
    const res = await fetch("/api/finance/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const updated = await res.json()
    setConfig(updated)
    toast.success("Configurações salvas!")
    setShowConfig(false)
  }

  const receitas = transacoes.filter(t => t.type === "Receita" && t.status === "Confirmado")
  const despesas = transacoes.filter(t => t.type === "Despesa" && t.status === "Confirmado")
  const totalReceitas = receitas.reduce((acc, t) => acc + t.amount, 0)
  const totalDespesas = despesas.reduce((acc, t) => acc + t.amount, 0)
  const saldo = totalReceitas - totalDespesas
  const comissaoTotal = totalReceitas * (config.doctorCommissionRate / 100)

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  return (
    <div className="flex h-full min-h-0 min-w-0 max-w-full flex-col gap-6 overflow-y-auto">
      <Header title="Financeiro">
        <Button variant="outline" size="sm" onClick={() => setShowConfig(true)}>
          <Settings size={15} /> Configurações
        </Button>
        <Button
          size="md"
          onClick={() => {
            reset({
              type: "Receita",
              status: "Confirmado",
              date: new Date().toISOString().slice(0, 10),
              category: "",
              description: "",
              amount: 0,
              paymentMethod: "",
            })
            setShowModal(true)
          }}
        >
          <Plus size={16} /> Nova transação
        </Button>
      </Header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} className="text-green-500" />
            <span className="text-xs text-gray-500">Receitas</span>
          </div>
          <p className="text-lg font-bold text-green-600">{fmt(totalReceitas)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown size={16} className="text-red-500" />
            <span className="text-xs text-gray-500">Despesas</span>
          </div>
          <p className="text-lg font-bold text-red-600">{fmt(totalDespesas)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={16} className={saldo >= 0 ? "text-blue-500" : "text-red-500"} />
            <span className="text-xs text-gray-500">Saldo</span>
          </div>
          <p className={`text-lg font-bold ${saldo >= 0 ? "text-blue-600" : "text-red-600"}`}>{fmt(saldo)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={16} className="text-purple-500" />
            <span className="text-xs text-gray-500">Comissão médicos</span>
          </div>
          <p className="text-lg font-bold text-purple-600">{fmt(comissaoTotal)}</p>
          <p className="text-xs text-gray-400">{config.doctorCommissionRate}% das receitas</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-gray-500 font-medium">Filtrar por</span>
        <Input
          type="month"
          value={mes}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setMes(e.target.value)}
          className="w-auto"
        />
        <FormSelect
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
          className="w-auto"
        >
          <option value="">Todos os tipos</option>
          <option value="Receita">Receitas</option>
          <option value="Despesa">Despesas</option>
        </FormSelect>
      </div>

      {loading ? (
        <TableSkeleton cols={6} rows={5} />
      ) : transacoes.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-accent">
          Nenhuma transação encontrada
        </div>
      ) : (
        <>
          {/* Celular: cartões (tabela larga não cabe bem na viewport estreita) */}
          <ul className="flex flex-col gap-3 md:hidden">
            {transacoes.map((t) => (
              <li
                key={t.id}
                className="space-y-3 rounded-xl bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <span className="text-xs text-gray-500">{t.date}</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${t.type === "Receita" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {t.type}
                    </span>
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${t.status === "Confirmado" ? "bg-green-100 text-green-700" : t.status === "Pendente" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}
                    >
                      {t.status}
                    </span>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-900">{t.category}</p>
                <p className="break-words text-sm text-gray-700">{t.description}</p>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3 text-sm">
                  <span className="text-gray-600">{t.paymentMethod ?? "—"}</span>
                  <span
                    className={`font-semibold ${t.type === "Receita" ? "text-green-600" : "text-red-600"}`}
                  >
                    {t.type === "Despesa" ? "- " : ""}
                    {fmt(t.amount)}
                  </span>
                </div>
                <div className="flex justify-end">
                  <Button variant="ghost-danger" onClick={() => handleDelete(t.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop / tablet: tabela com scroll horizontal se precisar */}
          <div className="hidden min-w-0 md:block md:overflow-x-auto">
            <table className="w-full min-w-[640px] border-separate border-spacing-y-2">
              <thead>
                <tr>
                  {["Data", "Tipo", "Categoria", "Descrição", "Forma Pgto", "Valor", "Status", ""].map((h) => (
                    <th key={h} className="px-3 text-left text-xs text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transacoes.map((t) => (
                  <tr key={t.id} className="bg-white shadow-sm">
                    <td className="p-3 text-sm text-gray-600">{t.date}</td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${t.type === "Receita" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-gray-600">{t.category}</td>
                    <td className="max-w-[14rem] break-words p-3 text-sm">{t.description}</td>
                    <td className="p-3 text-sm text-gray-600">{t.paymentMethod ?? "—"}</td>
                    <td
                      className={`p-3 text-sm font-semibold ${t.type === "Receita" ? "text-green-600" : "text-red-600"}`}
                    >
                      {t.type === "Despesa" ? "- " : ""}
                      {fmt(t.amount)}
                    </td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${t.status === "Confirmado" ? "bg-green-100 text-green-700" : t.status === "Pendente" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <Button variant="ghost-danger" onClick={() => handleDelete(t.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="max-h-[min(92vh,40rem)] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-4 shadow-lg sm:rounded-xl sm:p-6">
            <ModalHeader title="Nova transação" onClose={() => { setShowModal(false); reset() }} />
            <form onSubmit={handleSubmit(handleSave)} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormSelect label="Tipo" {...register("type")}>
                  <option value="Receita">Receita</option>
                  <option value="Despesa">Despesa</option>
                </FormSelect>
                <FormSelect
                  key={typeWatch}
                  label="Categoria"
                  {...register("category", { required: true })}
                >
                  <option value="">Selecione a categoria</option>
                  {(typeWatch === "Receita" ? RECEITA_CATEGORIAS : DESPESA_CATEGORIAS).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </FormSelect>
              </div>
              <Input label="Descrição" {...register("description", { required: true })} placeholder="Descrição da transação" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input label="Valor (R$)" type="number" step="0.01" {...register("amount", { required: true, valueAsNumber: true })} placeholder="0,00" />
                <Input label="Data" type="date" {...register("date", { required: true })} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormSelect label="Forma de pagamento (opcional em despesas)" {...register("paymentMethod")}>
                  <option value="">Não informado</option>
                  {FORMAS_PAGAMENTO.map(f => <option key={f} value={f}>{f}</option>)}
                </FormSelect>
                <FormSelect label="Status" {...register("status")}>
                  <option value="Confirmado">Confirmado</option>
                  <option value="Pendente">Pendente</option>
                </FormSelect>
              </div>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
                <Button type="button" variant="ghost" onClick={() => { setShowModal(false); reset() }}>Cancelar</Button>
                <Button type="submit" size="md">
                  Registrar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showConfig && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="max-h-[min(92vh,32rem)] w-full max-w-sm overflow-y-auto rounded-t-2xl bg-white p-4 shadow-lg sm:rounded-xl sm:p-6">
            <ModalHeader title="Configurações financeiras" onClose={() => setShowConfig(false)} />
            <form onSubmit={handleConfig(handleSaveConfig)} className="flex flex-col gap-4">
              <Input label="Valor da consulta (R$)" type="number" step="0.01" {...regConfig("consultationFee", { valueAsNumber: true })} />
              <Input label="Valor do retorno (R$)" type="number" step="0.01" {...regConfig("followUpFee", { valueAsNumber: true })} />
              <Input label="Comissão médico (%)" type="number" step="0.1" {...regConfig("doctorCommissionRate", { valueAsNumber: true })} />
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
                <Button type="button" variant="ghost" onClick={() => setShowConfig(false)}>Cancelar</Button>
                <Button type="submit" size="md">
                  Salvar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
