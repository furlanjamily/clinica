export const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024
export const MAX_AVATAR_SIZE_MB = 5

export const AVATAR_ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const

export const AVATAR_ACCEPTED_INPUT = AVATAR_ACCEPTED_MIME_TYPES.join(",")
