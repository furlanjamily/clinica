export const DEFAULT_FINANCIAL_CONFIG = {
  consultationFee: 150,
  followUpFee: 80,
  doctorCommissionRate: 40,
} as const

export type FinancialConfigValues = {
  consultationFee: number
  followUpFee: number
  doctorCommissionRate: number
}
