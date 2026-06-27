"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { Plus, Send, Smile, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ChatMessageDTO } from "@/lib/chat/types"

type PendingFile = {
  file: File
  preview?: string
}

type Props = {
  onSend: (content: string, replyToId?: number, files?: File[]) => Promise<unknown>
  onTyping?: () => void
  replyTo?: ChatMessageDTO | null
  editingContent?: string
  onCancelReply?: () => void
  disabled?: boolean
  className?: string
}

export function ChatInput({
  onSend,
  onTyping,
  replyTo,
  editingContent,
  onCancelReply,
  disabled,
  className,
}: Props) {
  const [text, setText] = useState("")
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const [sending, setSending] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingContent != null) setText(editingContent)
  }, [editingContent])

  const handleSend = useCallback(async () => {
    if (disabled || sending) return
    const trimmed = text.trim()
    if (!trimmed && pendingFiles.length === 0) return

    setSending(true)
    try {
      await onSend(
        trimmed,
        replyTo?.id,
        pendingFiles.map((p) => p.file)
      )
      setText("")
      setPendingFiles([])
      onCancelReply?.()
    } finally {
      setSending(false)
    }
  }, [disabled, sending, text, pendingFiles, onSend, replyTo, onCancelReply])

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    setPendingFiles((prev) => [...prev, ...files.map((file) => ({ file }))])
    e.target.value = ""
  }

  return (
    <div className={cn("shrink-0 border-t border-gray-100 bg-white px-4 py-4", className)}>
      {replyTo ? (
        <div className="mb-2 flex items-center justify-between rounded-xl bg-primary/[0.06] px-3 py-2 text-xs">
          <div>
            <span className="font-medium text-primary">Respondendo {replyTo.sender.name}</span>
            <p className="line-clamp-1 text-secondary">{replyTo.content}</p>
          </div>
          <button type="button" onClick={onCancelReply} aria-label="Cancelar resposta" className="text-secondary hover:text-primary">
            <X size={16} />
          </button>
        </div>
      ) : null}

      {pendingFiles.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-2">
          {pendingFiles.map((p, i) => (
            <div key={`${p.file.name}-${i}`} className="relative">
              <span className="rounded-lg bg-primary/10 px-2 py-1 text-xs text-primary">{p.file.name}</span>
              <button
                type="button"
                className="absolute -right-1 -top-1 rounded-full bg-primary px-1 text-[10px] text-white"
                onClick={() => setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex items-end gap-2 rounded-[28px] border border-gray-200 bg-gray-50/50 px-3 py-2 transition focus-within:border-primary/40 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/10">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-secondary transition hover:bg-primary/10 hover:text-primary"
          aria-label="Anexar"
        >
          <Plus size={20} />
        </button>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*,video/*,.pdf,.doc,.docx,.txt"
          className="hidden"
          onChange={onFileChange}
        />

        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            onTyping?.()
          }}
          onKeyDown={onKeyDown}
          placeholder="Digite uma mensagem"
          rows={1}
          disabled={disabled || sending}
          className="max-h-32 min-h-[40px] flex-1 resize-none bg-transparent py-2 text-sm text-gray-800 outline-none placeholder:text-accent"
        />

        <button
          type="button"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-secondary transition hover:bg-primary/10 hover:text-primary"
          aria-label="Emoji"
        >
          <Smile size={20} />
        </button>

        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={disabled || sending || (!text.trim() && pendingFiles.length === 0)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white transition hover:bg-primary/90 disabled:opacity-40"
          aria-label="Enviar"
        >
          <Send size={18} className="ml-0.5" />
        </button>
      </div>
    </div>
  )
}
