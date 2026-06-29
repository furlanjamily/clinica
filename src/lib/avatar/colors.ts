const AVATAR_PALETTE = [
  { background: "#F44336", color: "#FFFFFF" },
  { background: "#E91E63", color: "#FFFFFF" },
  { background: "#9C27B0", color: "#FFFFFF" },
  { background: "#673AB7", color: "#FFFFFF" },
  { background: "#3F51B5", color: "#FFFFFF" },
  { background: "#2196F3", color: "#FFFFFF" },
  { background: "#009688", color: "#FFFFFF" },
  { background: "#4CAF50", color: "#FFFFFF" },
  { background: "#FF9800", color: "#FFFFFF" },
  { background: "#795548", color: "#FFFFFF" },
  { background: "#607D8B", color: "#FFFFFF" },
] as const

export type AvatarColorPair = (typeof AVATAR_PALETTE)[number]

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

export function getAvatarColor(name: string | null | undefined): AvatarColorPair {
  const key = (name ?? "?").trim().toLowerCase() || "?"
  const index = hashString(key) % AVATAR_PALETTE.length
  return AVATAR_PALETTE[index]
}
