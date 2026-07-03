import { cn } from "@/lib/utils"

/**
 * Layout compartilhado para páginas com painel de filtros + tabela.
 * Mobile: scroll na página inteira (@container/main); filtros empurram a tabela;
 * tabela com h-[100cqh] e scroll interno das linhas.
 * Desktop: viewport fixo, flex column com overflow-hidden (original).
 */

/** Raiz da página (Agenda, Atendimentos, etc.) */
export const filterTablePageClass = cn(
  "flex min-w-0 max-w-full flex-col",
  "lg:h-full lg:min-h-0"
)

/** Coluna principal abaixo do título */
export const filterTableBodyClass = cn(
  "mt-3 flex min-w-0 flex-col gap-3 sm:mt-4 sm:gap-4",
  "lg:min-h-0 lg:flex-1 lg:overflow-hidden"
)

/** Filtros / bloco superior — altura natural, empurra a tabela ao expandir (mobile) */
export const filterTableFiltersClass = "shrink-0"

/**
 * Área da tabela — mobile: 100cqh (@container/main); desktop: flex-1 no viewport.
 */
export const filterTablePanelClass = cn(
  "flex min-w-0 flex-col overflow-hidden",
  "max-lg:h-[100cqh] max-lg:shrink-0",
  "lg:min-h-0 lg:h-auto lg:flex-1"
)

/** Wrapper interno da tabela (ScheduleView, etc.) */
export const filterTablePanelInnerClass = "flex h-full min-h-0 min-w-0 flex-col"

/** Shell: UserHeader + página; flex-1 repassa altura para Dashboard/Finance */
export const adminShellScrollContentClass = cn(
  "flex min-h-0 flex-1 flex-col gap-3 sm:gap-4"
)

/** Área da página abaixo do UserHeader */
export const adminShellPageClass = "flex min-h-0 flex-1 flex-col"

/** Scroll do @container/main */
export const adminShellMainScrollClass = cn(
  "overflow-y-auto overflow-x-clip",
  "[scrollbar-width:thin]"
)

/** Página de Atendimentos — scroll natural na página (como Financeiro) */
export const attendancePageClass = cn(
  "flex min-w-0 max-w-full flex-col"
)

/** Layout da raiz de Atendimentos (conteúdo acima + histórico) */
export const attendanceMobileRootClass = cn(
  "flex min-w-0 flex-col gap-4 sm:gap-6"
)

/** Seção superior — informações do atendimento em andamento + schedule/timer */
export const attendanceTopSectionClass = cn(
  "flex shrink-0 flex-col gap-3"
)

/** Seção do histórico */
export const attendanceHistorySectionClass = "flex shrink-0 flex-col gap-3"

/**
 * Filtros + tabela do histórico (mesmo padrão do Financeiro).
 * h-[100cqh] com scroll interno na tabela; a página rola naturalmente.
 */
export const attendanceFilterTableClass = cn(
  "flex h-[100cqh] min-h-0 min-w-0 flex-col gap-3 overflow-hidden"
)

/** Área scrollável da tabela dentro do bloco filtros + histórico */
export const attendanceHistoryPanelClass = cn(
  "flex min-h-0 flex-1 flex-col overflow-hidden"
)
