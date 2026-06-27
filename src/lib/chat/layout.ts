export type ChatLayoutMode = "mobile" | "dual" | "triple"

export const CHAT_LAYOUT = {
  mobileBreakpoint: 973,
  tripleMinContainerWidth: 980,
  gapPx: 16,
  columns: {
    sidebar: { dual: 280, triple: 320 },
    chatMin: 380,
    files: 300,
  },
} as const

export const MOBILE_CHAT_MQ = `(max-width: ${CHAT_LAYOUT.mobileBreakpoint}px)`

/** Primeiro px em que entra layout desktop (dual/triple). */
export const CHAT_DESKTOP_MIN_WIDTH = CHAT_LAYOUT.mobileBreakpoint + 1

export function getSidebarWidth(mode: "dual" | "triple"): number {
  return mode === "triple"
    ? CHAT_LAYOUT.columns.sidebar.triple
    : CHAT_LAYOUT.columns.sidebar.dual
}
