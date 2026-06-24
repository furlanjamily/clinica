export const financeColors = {
  primary: "#9747FF",
  primaryHover: "#8538F0",
  primaryDark: "#5B21B6",
  secondary: "#766889",
  /** Saldo / lucro — teal para contrastar com receita (roxo) e despesa (cinza-roxo). */
  balance: "#0D9488",
  lightBg: "#F3EEFF",
  lightAccent: "#E9D5FF",
  secondaryBg: "#F0EDF3",
  savingBg: "#EDE9FE",
  cardGradient: "linear-gradient(135deg, #5B21B6 0%, #8538F0 50%, #9747FF 100%)",
  foreground: "#52525B",
  muted: "#A1A1AA",
  border: "#E5E7EB",
  divider: "#F3F4F6",
} as const

/** Hierarquia de texto — cinza escuro clean (zinc) em vez de preto */
export const financeText = {
  heading: "#52525B",
  body: "#71717A",
  muted: "#A1A1AA",
} as const

export const financeRecordCards = {
  income: {
    bg: financeColors.lightBg,
    chart: financeColors.primary,
    percent: financeColors.primaryHover,
  },
  expense: {
    bg: financeColors.secondaryBg,
    chart: financeColors.secondary,
    percent: financeColors.secondary,
  },
  saving: {
    bg: financeColors.savingBg,
    chart: financeColors.primaryHover,
    percent: financeColors.primaryDark,
  },
} as const
