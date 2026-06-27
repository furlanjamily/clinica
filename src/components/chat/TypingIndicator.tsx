"use client"

import { motion } from "framer-motion"

type Props = {
  users: Array<{ userId: string; name: string | null }>
}

export function TypingIndicator({ users }: Props) {
  if (users.length === 0) return null

  const label =
    users.length === 1
      ? `${users[0].name ?? "Alguém"} está digitando`
      : `${users.length} pessoas estão digitando`

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-2 px-2 py-1 text-xs text-secondary"
    >
      <span>{label}</span>
      <span className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-primary"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </span>
    </motion.div>
  )
}
