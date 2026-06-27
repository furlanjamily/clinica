"use client"

import { absoluteUrl } from "@/lib/absolute-url"
import type {
  ChatMessageDTO,
  ConversationDTO,
  ConversationSearchResult,
  MessagesPageDTO,
  UploadResultDTO,
} from "@/lib/chat/types"

export async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json()
    return body?.message ?? fallback
  } catch {
    return fallback
  }
}

export async function fetchConversations(
  search?: string,
  archived?: boolean
): Promise<ConversationSearchResult> {
  const params = new URLSearchParams()
  if (search) params.set("q", search)
  if (archived) params.set("archived", "true")
  const res = await fetch(absoluteUrl(`/api/chat?${params}`))
  if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao buscar conversas"))
  return res.json()
}

export async function fetchConversation(conversationId: number): Promise<ConversationDTO> {
  const res = await fetch(absoluteUrl(`/api/chat/${conversationId}`))
  if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao buscar conversa"))
  return res.json()
}

export async function fetchMessages(
  conversationId: number,
  cursor?: number,
  search?: string
): Promise<MessagesPageDTO> {
  const params = new URLSearchParams({ conversationId: String(conversationId) })
  if (cursor) params.set("cursor", String(cursor))
  if (search) params.set("search", search)
  const res = await fetch(absoluteUrl(`/api/chat/messages?${params}`))
  if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao buscar mensagens"))
  return res.json()
}

export async function fetchAttachments(conversationId: number) {
  const res = await fetch(
    absoluteUrl(`/api/chat/${conversationId}?attachments=true`)
  )
  if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao buscar anexos"))
  return res.json()
}

export async function postMessage(payload: {
  conversationId: number
  content?: string
  replyToId?: number
  attachments?: UploadResultDTO[]
}): Promise<ChatMessageDTO> {
  const res = await fetch(absoluteUrl("/api/chat/messages"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao enviar mensagem"))
  return res.json()
}

export async function patchMessage(messageId: number, content: string): Promise<ChatMessageDTO> {
  const res = await fetch(absoluteUrl("/api/chat/messages"), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messageId, content }),
  })
  if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao editar mensagem"))
  return res.json()
}

export async function deleteMessageApi(messageId: number): Promise<void> {
  const res = await fetch(absoluteUrl("/api/chat/messages"), {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messageId }),
  })
  if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao excluir mensagem"))
}

export async function markReadApi(
  conversationId: number,
  messageIds?: number[]
): Promise<void> {
  const res = await fetch(absoluteUrl("/api/chat/read"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversationId, messageIds }),
  })
  if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao marcar como lida"))
}

export async function setTypingApi(conversationId: number, isTyping: boolean): Promise<void> {
  await fetch(absoluteUrl("/api/chat/typing"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversationId, isTyping }),
  })
}

export async function updateConversationApi(
  conversationId: number,
  data: {
    isFavorite?: boolean
    isMuted?: boolean
    isArchived?: boolean
    category?: string | null
  }
): Promise<ConversationDTO> {
  const res = await fetch(absoluteUrl(`/api/chat/${conversationId}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao atualizar conversa"))
  return res.json()
}

export async function uploadChatFile(file: File): Promise<UploadResultDTO> {
  const formData = new FormData()
  formData.append("file", file)
  const res = await fetch(absoluteUrl("/api/chat/upload"), {
    method: "POST",
    body: formData,
  })
  if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao enviar arquivo"))
  return res.json()
}

export async function deliverMessageApi(messageId: number): Promise<void> {
  await fetch(absoluteUrl("/api/chat/messages"), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messageId }),
  })
}

export async function fetchChatUsers() {
  const res = await fetch(absoluteUrl("/api/chat?action=users"))
  if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao buscar usuários"))
  return res.json() as Promise<import("@/lib/chat/types").ChatUser[]>
}

export async function createConversationApi(participantIds: string[]) {
  const res = await fetch(absoluteUrl("/api/chat"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participantIds }),
  })
  if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao criar conversa"))
  return res.json() as Promise<import("@/lib/chat/types").ConversationDTO>
}
