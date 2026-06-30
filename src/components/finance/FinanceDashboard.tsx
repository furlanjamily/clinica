"use client"

import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { FileText, Loader2, Settings } from "lucide-react"
import { FinanceTransactionsTable } from "@/components/finance/FinanceTransactionsTable"
import { TableSkeleton } from "@/components/ui/TableSkeleton"
import { TableCard } from "@/components/ui/table/DataTable"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/ui/PageHeader"
import { ModalHeader } from "@/components/ui/ModalHeader"
import { ModalOverlay, ModalPanel } from "@/components/ui/modal-overlay"
import { Input, FormSelect } from "@/components/ui/Input"
import {
  DESPESA_CATEGORIAS,
  RECEITA_CATEGORIAS,
  TRANSACTION_PAYMENT_METHODS,
} from "@/lib/finance/categories"
import { DEFAULT_FINANCIAL_CONFIG, type FinancialConfigValues } from "@/lib/finance/config"
import {
  TransactionStatus,
  TransactionType,
  TRANSACTION_STATUS_OPTIONS,
  TRANSACTION_TYPE_OPTIONS,
  type FinanceTransaction,
} from "@/lib/finance/types"
import { summarizeTransactions } from "@/lib/finance/summary"
import {
  EMPTY_TRANSACTION_FILTERS,
  TRANSACTION_FILTER_FIELDS,
  filterTransactions,
} from "@/lib/finance/transaction-filters"
import {
  useFinanceTransactions,
  useFinanceYearTransactions,
  useFinancialConfig,
  useFinanceMutations,
} from "@/hooks/useFinance"
import { Collapse } from "@/components/ui/Collapse"
import { GlobalFilters } from "@/components/ui/table/GlobalFilters"
import { useTableFilters } from "@/hooks/useTableFilters"
import {
  filterTransactionsByPeriod,
  getPreviousMonthKey,
  type RecordPeriod,
} from "@/lib/finance/period-filter"
import { getTodayYYYYMMDD } from "@/lib/time/tz-date"
import { useClientMounted } from "@/hooks/useClientMounted"
import { UserHeader } from "@/components/ui/user-header"
import { FinancialRecord } from "./FinancialRecord"
import { MoneyFlow } from "./MoneyFlow"
import { MyCard } from "./MyCard"
import { FinanceReportCapture } from "./report/FinanceReportCapture"
import { useFinanceReportGenerator } from "@/hooks/useFinanceReportGenerator"

type TransactionForm = Omit<FinanceTransaction, "id">

function emptyTransactionForm(): TransactionForm {
  return {
    type: TransactionType.Income,
    status: TransactionStatus.Confirmed,
    date: getTodayYYYYMMDD(),
    category: "",
    description: "",
    amount: 0,
    paymentMethod: "",
  }
}

function currentMonth(): string {
  return getTodayYYYYMMDD().slice(0, 7)
}

export function FinanceDashboard() {
  const [showModal, setShowModal] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [recordPeriod, setRecordPeriod] = useState<RecordPeriod>("mes")
  const [month] = useState(currentMonth)
  const [typeFilter] = useState("")
  const mounted = useClientMounted()
  const { filters, handleFilterChange } = useTableFilters(EMPTY_TRANSACTION_FILTERS)

  const previousMonth = useMemo(() => getPreviousMonthKey(month), [month])
  const currentYear = useMemo(() => month.slice(0, 4), [month])
  const previousYear = useMemo(() => String(Number(currentYear) - 1), [currentYear])

  const { data: transactions = [], isPending: loadingTransactions } =
    useFinanceTransactions(month, typeFilter)
  const { data: previousTransactions = [], isPending: loadingPreviousTransactions } =
    useFinanceTransactions(previousMonth, typeFilter)
  const { data: yearTransactions = [], isPending: loadingYearTransactions } =
    useFinanceYearTransactions(currentYear, typeFilter)
  const { data: previousYearTransactions = [], isPending: loadingPreviousYearTransactions } =
    useFinanceYearTransactions(previousYear, typeFilter)
  const { data: config = DEFAULT_FINANCIAL_CONFIG } = useFinancialConfig()
  const { createTransaction, removeTransaction, saveConfig } =
    useFinanceMutations(month, typeFilter)

  const { register, handleSubmit, reset, watch } = useForm<TransactionForm>({
    defaultValues: emptyTransactionForm(),
  })
  const {
    register: registerConfig,
    handleSubmit: submitConfig,
    reset: resetConfig,
  } = useForm<FinancialConfigValues>()

  const selectedType = watch("type")
  const categoryOptions =
    selectedType === TransactionType.Income ? RECEITA_CATEGORIAS : DESPESA_CATEGORIAS

  useEffect(() => {
    resetConfig(config)
  }, [config, resetConfig])

  const recordTransactions = useMemo(
    () => [...yearTransactions, ...previousYearTransactions],
    [yearTransactions, previousYearTransactions]
  )

  const periodTransactions = useMemo(
    () => filterTransactionsByPeriod(yearTransactions, recordPeriod),
    [yearTransactions, recordPeriod]
  )

  const filteredTransactions = useMemo(
    () => filterTransactions(periodTransactions, filters),
    [periodTransactions, filters]
  )

  const { balance } = summarizeTransactions(transactions, config.doctorCommissionRate)
  const { balance: previousBalance } = summarizeTransactions(
    previousTransactions,
    config.doctorCommissionRate
  )
  const financeLoading =
    loadingTransactions ||
    loadingPreviousTransactions ||
    loadingYearTransactions ||
    loadingPreviousYearTransactions ||
    !mounted
  const overviewLoading =
    loadingYearTransactions || loadingPreviousYearTransactions || !mounted

  const { generateReport, isGenerating } = useFinanceReportGenerator({
    transactions: yearTransactions,
    period: recordPeriod,
    commissionRate: config.doctorCommissionRate,
    isDataReady: !overviewLoading,
  })

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

  function closeTransactionModal() {
    setShowModal(false)
    reset(emptyTransactionForm())
  }

  return (
    <div className="-mx-1 flex flex-col px-6">
      <div className="flex flex-col gap-6">
      <UserHeader />

      <div className="shrink-0">
        <Header title="Financeiro">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void generateReport()}
              disabled={isGenerating || overviewLoading}
            >
              {isGenerating ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <FileText size={15} />
              )}
              Gerar Relatório
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowConfig(true)}>
              <Settings size={15} /> Configurações
            </Button>
          </div>
        </Header>
      </div>

      <div className="shrink-0">
        <MyCard
          balance={balance}
          previousBalance={previousBalance}
          isLoading={financeLoading}
          onNewTransaction={() => {
            reset(emptyTransactionForm())
            setShowModal(true)
          }}
        />
      </div>

      <div className="shrink-0">
        <FinancialRecord
          transactions={recordTransactions}
          commissionRate={config.doctorCommissionRate}
          period={recordPeriod}
          onPeriodChange={setRecordPeriod}
          isLoading={overviewLoading}
        />
      </div>

      <div className="shrink-0">
        <MoneyFlow
          transactions={yearTransactions}
          period={recordPeriod}
          commissionRate={config.doctorCommissionRate}
          isLoading={overviewLoading}
        />
      </div>

      <div className="flex h-[100cqh] min-h-0 min-w-0 flex-col gap-3 overflow-hidden">
        <div className="flex shrink-0 flex-col justify-center gap-3 rounded-3xl border border-gray-200 bg-white p-4 sm:p-5">
          <Collapse label="Filtros" unboundedPanel>
            <GlobalFilters
              values={filters}
              onChange={(name, value) =>
                handleFilterChange(name as keyof typeof filters, value)
              }
              filters={TRANSACTION_FILTER_FIELDS}
            />
          </Collapse>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {loadingYearTransactions ? (
            <TableCard>
              <div className="p-2 sm:p-3">
                <TableSkeleton cols={6} rows={5} />
              </div>
            </TableCard>
          ) : (
            <FinanceTransactionsTable
              transactions={filteredTransactions}
              onRemove={removeTransaction}
            />
          )}
        </div>
      </div>

      {showModal && (
        <ModalOverlay>
          <ModalPanel>
            <ModalHeader title="Nova transação" onClose={closeTransactionModal} />
            <form onSubmit={handleSubmit(handleSave)} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormSelect label="Tipo" {...register("type")}>
                  {TRANSACTION_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </FormSelect>
                <FormSelect
                  key={selectedType}
                  label="Categoria"
                  {...register("category", { required: true })}
                >
                  <option value="">Selecione a categoria</option>
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </FormSelect>
              </div>
              <Input
                label="Descrição"
                {...register("description", { required: true })}
                placeholder="Descrição da transação"
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  label="Valor (R$)"
                  type="number"
                  step="0.01"
                  {...register("amount", { required: true, valueAsNumber: true })}
                  placeholder="0,00"
                />
                <Input label="Data" type="date" {...register("date", { required: true })} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormSelect
                  label="Forma de pagamento (opcional em despesas)"
                  {...register("paymentMethod")}
                >
                  <option value="">Não informado</option>
                  {TRANSACTION_PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </FormSelect>
                <FormSelect label="Status" {...register("status")}>
                  {TRANSACTION_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </FormSelect>
              </div>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
                <Button type="button" variant="ghost" onClick={closeTransactionModal}>
                  Cancelar
                </Button>
                <Button type="submit" size="md">
                  Registrar
                </Button>
              </div>
            </form>
          </ModalPanel>
        </ModalOverlay>
      )}

      {!overviewLoading && (
        <FinanceReportCapture
          transactions={yearTransactions}
          period={recordPeriod}
          commissionRate={config.doctorCommissionRate}
        />
      )}

      {showConfig && (
        <ModalOverlay>
          <ModalPanel size="sm">
            <ModalHeader title="Configurações financeiras" onClose={() => setShowConfig(false)} />
            <form onSubmit={submitConfig(handleSaveConfig)} className="flex flex-col gap-4">
              <Input
                label="Valor da consulta (R$)"
                type="number"
                step="0.01"
                {...registerConfig("consultationFee", { valueAsNumber: true })}
              />
              <Input
                label="Valor do retorno (R$)"
                type="number"
                step="0.01"
                {...registerConfig("followUpFee", { valueAsNumber: true })}
              />
              <Input
                label="Comissão médico (%)"
                type="number"
                step="0.1"
                {...registerConfig("doctorCommissionRate", { valueAsNumber: true })}
              />
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
                <Button type="button" variant="ghost" onClick={() => setShowConfig(false)}>
                  Cancelar
                </Button>
                <Button type="submit" size="md">
                  Salvar
                </Button>
              </div>
            </form>
          </ModalPanel>
        </ModalOverlay>
      )}
      </div>
    </div>
  )
}
