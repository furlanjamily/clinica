"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Plus, Trash2, Settings, TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import { TableSkeleton } from "@/components/ui/TableSkeleton"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/ui/PageHeader"
import { ModalHeader } from "@/components/ui/ModalHeader"
import { Input, FormSelect } from "@/components/ui/Input"

type Transacao = {
  id: number
  tipo: "Receita" | "Despesa"
  categoria: string
  descricao: string
  valor: number
  data: string
  formaPagamento?: string
  status: string
}

type Config = {
  valorConsulta: number
  valorRetorno: number
  comissaoMedico: number
}

const CATEGORIAS_RECEITA = ["Consulta", "Retorno", "Outros"]
const CATEGORIAS_DESPESA = ["Aluguel", "Material", "Salário", "Equipamento", "Marketing", "Outros"]
const FORMAS_PAGAMENTO = ["Dinheiro", "Cartão de Crédito", "Cartão de Débito", "Pix", "Convênio", "Transferência"]

export default function FinancePage() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [config, setConfig] = useState<Config>({ valorConsulta: 150, valorRetorno: 80, comissaoMedico: 40 })
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [mes, setMes] = useState(new Date().toISOString().slice(0, 7))
  const [tipoFiltro, setTipoFiltro] = useState("")

  const { register, handleSubmit, reset, watch } = useForm<Omit<Transacao, "id">>({
    defaultValues: { tipo: "Receita", status: "Confirmado" }
  })
  const { register: regConfig, handleSubmit: handleConfig, reset: resetConfig } = useForm<Config>()

  const tipoWatch = watch("tipo")

  useEffect(() => {
    Promise.all([
      fetch(`/api/finance/transactions?mes=${mes}${tipoFiltro ? `&tipo=${tipoFiltro}` : ""}`).then(r => r.json()),
      fetch("/api/finance/config").then(r => r.json()),
    ]).then(([t, c]) => {
      setTransacoes(t)
      setConfig(c)
      resetConfig(c)
      setLoading(false)
    })
  }, [mes, tipoFiltro, resetConfig])

  async function handleSave(data: any) {
    const res = await fetch("/api/finance/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const nova = await res.json()
    setTransacoes(prev => [nova, ...prev])
    toast.success("Transação registrada!")
    setShowModal(false)
    reset()
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

  const receitas = transacoes.filter(t => t.tipo === "Receita" && t.status === "Confirmado")
  const despesas = transacoes.filter(t => t.tipo === "Despesa" && t.status === "Confirmado")
  const totalReceitas = receitas.reduce((acc, t) => acc + t.valor, 0)
  const totalDespesas = despesas.reduce((acc, t) => acc + t.valor, 0)
  const saldo = totalReceitas - totalDespesas
  const comissaoTotal = totalReceitas * (config.comissaoMedico / 100)

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  return (
    <div className="flex flex-col h-full min-h-0 overflow-auto gap-6">
      <Header title="Financeiro">
        <Button variant="outline" size="sm" onClick={() => setShowConfig(true)}>
          <Settings size={15} /> Configurações
        </Button>
        <Button size="md" onClick={() => { reset(); setShowModal(true) }}>
          <Plus size={16} /> Nova transação
        </Button>
      </Header>

      {/* Cards de resumo */}
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
          <p className="text-xs text-gray-400">{config.comissaoMedico}% das receitas</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-gray-500 font-medium">Filtrar por</span>
        <Input
          type="month"
          value={mes}
          onChange={(e) => setMes(e.target.value)}
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

      {/* Tabela */}
      {loading ? <TableSkeleton cols={6} rows={5} /> : transacoes.length === 0 ? (
        <div className="flex items-center justify-center flex-1 text-accent text-sm">
          Nenhuma transação encontrada
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-2 min-w-[600px]">
            <thead>
              <tr>{["Data", "Tipo", "Categoria", "Descrição", "Forma Pgto", "Valor", "Status", ""].map((h) => (
                <th key={h} className="text-left text-xs px-3 text-gray-500">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {transacoes.map((t) => (
                <tr key={t.id} className="bg-white shadow-sm">
                  <td className="p-3 text-sm text-gray-600">{t.data}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${t.tipo === "Receita" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {t.tipo}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-gray-600">{t.categoria}</td>
                  <td className="p-3 text-sm">{t.descricao}</td>
                  <td className="p-3 text-sm text-gray-600">{t.formaPagamento ?? "—"}</td>
                  <td className={`p-3 text-sm font-semibold ${t.tipo === "Receita" ? "text-green-600" : "text-red-600"}`}>
                    {t.tipo === "Despesa" ? "- " : ""}{fmt(t.valor)}
                  </td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${t.status === "Confirmado" ? "bg-green-100 text-green-700" : t.status === "Pendente" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
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
      )}

      {/* Modal nova transação */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
            <ModalHeader title="Nova transação" onClose={() => { setShowModal(false); reset() }} />
            <form onSubmit={handleSubmit(handleSave)} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <FormSelect label="Tipo" {...register("tipo")}>
                  <option value="Receita">Receita</option>
                  <option value="Despesa">Despesa</option>
                </FormSelect>
                <FormSelect label="Categoria" {...register("categoria", { required: true })}>
                  <option value="">Selecione</option>
                  {(tipoWatch === "Receita" ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </FormSelect>
              </div>
              <Input label="Descrição" {...register("descricao", { required: true })} placeholder="Descrição da transação" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Valor (R$)" type="number" step="0.01" {...register("valor", { required: true, valueAsNumber: true })} placeholder="0,00" />
                <Input label="Data" type="date" {...register("data", { required: true })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormSelect label="Forma de pagamento" {...register("formaPagamento")}>
                  <option value="">Selecione</option>
                  {FORMAS_PAGAMENTO.map(f => <option key={f} value={f}>{f}</option>)}
                </FormSelect>
                <FormSelect label="Status" {...register("status")}>
                  <option value="Confirmado">Confirmado</option>
                  <option value="Pendente">Pendente</option>
                </FormSelect>
              </div>
              <div className="flex justify-end gap-3 mt-2">
                <Button type="button" variant="ghost" onClick={() => { setShowModal(false); reset() }}>Cancelar</Button>
                <Button type="submit" size="md">
                  Registrar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal configurações */}
      {showConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-lg">
            <ModalHeader title="Configurações financeiras" onClose={() => setShowConfig(false)} />
            <form onSubmit={handleConfig(handleSaveConfig)} className="flex flex-col gap-4">
              <Input label="Valor da consulta (R$)" type="number" step="0.01" {...regConfig("valorConsulta", { valueAsNumber: true })} />
              <Input label="Valor do retorno (R$)" type="number" step="0.01" {...regConfig("valorRetorno", { valueAsNumber: true })} />
              <Input label="Comissão médico (%)" type="number" step="0.1" {...regConfig("comissaoMedico", { valueAsNumber: true })} />
              <div className="flex justify-end gap-3 mt-2">
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
