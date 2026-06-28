export const CHAT_CONVERSATION_QUERY_KEY = "conversation"

export function buildChatConversationHref(conversationId: number): string {
  return `/chat?${CHAT_CONVERSATION_QUERY_KEY}=${conversationId}`
}

export function parseChatConversationId(
  value: string | null | undefined
): number | null {
  if (!value) return null
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}
