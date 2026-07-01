import type { DashboardPeriod } from "./DashboardDataProvider"

export const DASHBOARD_PANEL_HEIGHT = 600

export const DASHBOARD_PANEL_HEIGHT_MONTH = 580

export function getDashboardPanelHeight(period: DashboardPeriod): number {
  return period === "month" ? DASHBOARD_PANEL_HEIGHT_MONTH : DASHBOARD_PANEL_HEIGHT
}

export const DASHBOARD_PANEL_SHELL =
  "flex h-full max-h-full min-h-0 flex-col overflow-hidden"

export const DASHBOARD_PANELS_GRID = "grid shrink-0 grid-rows-2 gap-5 sm:gap-6"

export const DASHBOARD_PANEL_BODY =
  "relative min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]"

export const DASHBOARD_PANEL_HEADER =
  "mb-5 flex min-h-[3.25rem] shrink-0 items-start justify-between gap-2"

export const DASHBOARD_LAST_VISIT_SHELL =
  "flex h-[610px] min-h-[610px] max-h-[610px] shrink-0 flex-col overflow-hidden"

export const DASHBOARD_LAST_VISIT_BODY =
  "relative min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]"

export const DASHBOARD_CALENDAR_BODY_WEEK = "grid grid-cols-7 gap-1 text-center"

export const DASHBOARD_CALENDAR_BODY_MONTH =
  "grid grid-cols-7 gap-1 text-center content-start"
