"use client"

import { useEffect, useState, type ChangeEvent } from "react"
import { useForm } from "react-hook-form"
import { Plus, Trash2, Settings, TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import { TableSkeleton } from "@/components/ui/TableSkeleton"
import { DataTable, TableCard, Td } from "@/components/ui/table/DataTable"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/ui/PageHeader"
import { ModalHeader } from "@/components/ui/ModalHeader"
import { ModalOverlay } from "@/components/ui/modal-overlay"
import { Input, FormSelect } from "@/components/ui/Input"
import {
  DESPESA_CATEGORIAS,
  RECEITA_CATEGORIAS,
  TRANSACTION_PAYMENT_METHODS,
} from "@/lib/finance/categories"
import { DEFAULT_FINANCIAL_CONFIG, type FinancialConfigValues } from "@/lib/finance/config"
import type { FinanceTransaction } from "@/lib/finance/types"
import { formatBRL, summarizeTransactions } from "@/lib/finance/summary"
import {
  useFinanceTransactions,
  useFinancialConfig,
  useFinanceMutations,
} from "@/hooks/useFinance"
import { Collapse } from "@/components/ui/Collapse"
import { FilterField, GlobalFilters } from "@/components/ui/table/GlobalFilters"
import { useTableFilters } from "@/hooks/useTableFilters"

type TransactionForm = Omit<FinanceTransaction, "id">

function emptyTransactionForm(): TransactionForm {
  return {
    type: "Receita",
    status: "Confirmado",
    date: new Date().toISOString().slice(0, 10),
    category: "",
    description: "",
    amount: 0,
    paymentMethod: "",
  }
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7)
}

export default function FinancePage() {
  const [showModal, setShowModal] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [month] = useState(currentMonth)
  const [typeFilter] = useState("")
  const { filters, handleFilterChange } = useTableFilters({
    date: "",
    type: "",
    category: "",
    paymentMethod: "",
    status: "",
  })


  const { data: transactions = [], isPending: loadingTransactions } =
    useFinanceTransactions(month, typeFilter)
  const { data: config = DEFAULT_FINANCIAL_CONFIG } = useFinancialConfig()
  const { createTransaction, removeTransaction, saveConfig } =
    useFinanceMutations(month, typeFilter)

  const { register, handleSubmit, reset, watch } = useForm<TransactionForm>({
    defaultValues: emptyTransactionForm(),
  })
  const { register: regConfig, handleSubmit: handleConfig, reset: resetConfig } =
    useForm<FinancialConfigValues>()

  const typeWatch = watch("type")

  useEffect(() => {
    resetConfig(config)
  }, [config, resetConfig])

  async function handleSave(data: TransactionForm) {
    const created = await createTransaction(data)
    if (!created) return
    setShowModal(false)
    reset(emptyTransactionForm())
  }

  async function handleSaveConfig(data: FinancialConfigValues) {
    const updated = await saveConfig(data)
    if (!updated) return
    setShowConfig(false)
  }

  const { totalIncome, totalExpense, balance, commission } = summarizeTransactions(
    transactions,
    config.doctorCommissionRate
  )

  function FinanceTable() {
    return (
      <DataTable<FinanceTransaction>
        headers={[
          { label: "Data", sort: (t) => t.date },
          { label: "Tipo", sort: (t) => t.type },
          { label: "Categoria", sort: (t) => t.category },
          { label: "Descrição", sort: (t) => t.description },
          { label: "Forma Pgto", sort: (t) => t.paymentMethod || null },
          { label: "Valor", sort: (t) => t.amount * (t.type === "Despesa" ? -1 : 1) },
          { label: "Status", sort: (t) => t.status },
          { label: "Ações", align: "right" },
        ]}
        data={filteredTransactions}
        emptyMessage="Nenhuma transação encontrada"
        renderRow={(t) => (
          <tr key={t.id} className="transition-colors hover:bg-gray-50/80">
            <Td className="text-gray-600">{t.date}</Td>
            <Td>
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${t.type === "Receita" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
              >
                {t.type}
              </span>
            </Td>
            <Td className="text-gray-600">{t.category}</Td>
            <Td className="max-w-[14rem] break-words">{t.description}</Td>
            <Td className="text-gray-600">{t.paymentMethod ?? "—"}</Td>
            <Td
              className={`font-semibold ${t.type === "Receita" ? "text-green-600" : "text-red-600"}`}
            >
              {t.type === "Despesa" ? "- " : ""}
              {formatBRL(t.amount)}
            </Td>
            <Td>
              <span
                className={`rounded-full px-2 py-1 text-xs ${t.status === "Confirmado" ? "bg-green-100 text-green-700" : t.status === "Pendente" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}
              >
                {t.status}
              </span>
            </Td>
            <Td>
              <div className="flex justify-end">
                <Button variant="ghost-danger" onClick={() => removeTransaction(t.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </Td>
          </tr>
        )}
      />
    )
  }

  const ALL_CATEGORIES = [...new Set([...RECEITA_CATEGORIAS, ...DESPESA_CATEGORIAS])]

  const FILTER_CONFIG: FilterField[] = [
    { name: "date", type: "date" as const },
    { name: "type", type: "select" as const, options: [{ value: "", label: "Todos os tipos" }, { value: "Receita", label: "Receitas" }, { value: "Despesa", label: "Despesas" }], placeholder: "Tipo..." },
    { name: "category", type: "select" as const, options: [{ value: "", label: "Todas as categorias" }, ...ALL_CATEGORIES.map(c => ({ value: c, label: c }))], placeholder: "Categoria..." },
    { name: "paymentMethod", type: "select" as const, options: [{ value: "", label: "Todas as formas de pagamento" }, ...TRANSACTION_PAYMENT_METHODS.map(f => ({ value: f, label: f }))], placeholder: "Forma de pagamento..." },
    { name: "status", type: "select" as const, options: [{ value: "", label: "Todos os status" }, { value: "Confirmado", label: "Confirmado" }, { value: "Pendente", label: "Pendente" }], placeholder: "Status..." },
  ]

  const filteredTransactions = transactions.filter((t) => {
    const matchDate = filters.date ? t.date === filters.date : true
    const matchType = filters.type ? t.type === filters.type : true
    const matchCategory = filters.category ? t.category === filters.category : true
    const matchPaymentMethod = filters.paymentMethod ? t.paymentMethod === filters.paymentMethod : true
    const matchStatus = filters.status ? t.status === filters.status : true
    return matchDate && matchType && matchCategory && matchPaymentMethod && matchStatus
  })


  return (
    <div className="flex h-full min-w-0 min-h-0 max-w-full flex-col gap-6">
      <Header title="Financeiro">
        <Button variant="outline" size="sm" onClick={() => setShowConfig(true)}>
          <Settings size={15} /> Configurações
        </Button>
        <Button
          size="md"
          onClick={() => {
            reset(emptyTransactionForm())
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
          <p className="text-lg font-bold text-green-600">{formatBRL(totalIncome)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown size={16} className="text-red-500" />
            <span className="text-xs text-gray-500">Despesas</span>
          </div>
          <p className="text-lg font-bold text-red-600">{formatBRL(totalExpense)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={16} className={balance >= 0 ? "text-blue-500" : "text-red-500"} />
            <span className="text-xs text-gray-500">Saldo</span>
          </div>
          <p className={`text-lg font-bold ${balance >= 0 ? "text-blue-600" : "text-red-600"}`}>{formatBRL(balance)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={16} className="text-purple-500" />
            <span className="text-xs text-gray-500">Comissão médicos</span>
          </div>
          <p className="text-lg font-bold text-purple-600">{formatBRL(commission)}</p>
          <p className="text-xs text-gray-400">{config.doctorCommissionRate}% das receitas</p>
        </div>
      </div>

      <div className="flex flex-col justify-center gap-3 rounded-3xl border border-gray-200 bg-white p-4 sm:p-5">
        <Collapse label="Filtros" unboundedPanel>
          <GlobalFilters
            values={filters}
            onChange={(name, value) => handleFilterChange(name as keyof typeof filters, value)}
            filters={FILTER_CONFIG}
          />
        </Collapse>
      </div>

      <div className="mt-4 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {loadingTransactions ? (
          <TableCard>
            <div className="p-2 sm:p-3">
              <TableSkeleton cols={6} rows={5} />
            </div>
          </TableCard>
        ) : (
          <FinanceTable />
        )}
      </div>
      {showModal && (
        <ModalOverlay>
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
                  {TRANSACTION_PAYMENT_METHODS.map(f => <option key={f} value={f}>{f}</option>)}
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
        </ModalOverlay>
      )}

      {showConfig && (
        <ModalOverlay>
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
        </ModalOverlay>
      )}
    </div>
  )
}
