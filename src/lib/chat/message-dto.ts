import type {
  ChatAttachment,
  Message,
  MessageReaction,
  MessageRead,
  User,
} from "@/generated/prisma/client"
import type { ChatAttachmentDTO, ChatMessageDTO, ChatUser } from "./types"
import { resolveJobTitle } from "./format"

type MessageWithRelations = Message & {
  sender: User
  attachments: ChatAttachment[]
  reads: MessageRead[]
  reactions: MessageReaction[]
  replyTo: (Message & { sender: User }) | null
}

export function toChatUser(user: User, isOnline = false): ChatUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
    isOnline,
    jobTitle: resolveJobTitle(user.role),
  }
}

export function toAttachmentDTO(a: ChatAttachment): ChatAttachmentDTO {
  return {
    id: a.id,
    fileName: a.fileName,
    fileUrl: a.fileUrl,
    mimeType: a.mimeType,
    sizeBytes: a.sizeBytes,
    type: a.type,
    thumbnailUrl: a.thumbnailUrl,
    createdAt: a.createdAt.toISOString(),
  }
}

function groupReactions(reactions: MessageReaction[]) {
  const map = new Map<string, { emoji: string; userId: string; count: number }>()
  for (const r of reactions) {
    const key = r.emoji
    const existing = map.get(key)
    if (existing) {
      existing.count += 1
    } else {
      map.set(key, { emoji: r.emoji, userId: r.userId, count: 1 })
    }
  }
  return Array.from(map.values())
}

export function toMessageDTO(
  msg: MessageWithRelations,
  onlineUserIds?: Set<string>
): ChatMessageDTO {
  return {
    id: msg.id,
    conversationId: msg.conversationId,
    senderId: msg.senderId,
    sender: toChatUser(msg.sender, onlineUserIds?.has(msg.senderId)),
    content: msg.isDeleted ? null : msg.content,
    replyToId: msg.replyToId,
    replyTo: msg.replyTo
      ? {
          id: msg.replyTo.id,
          content: msg.replyTo.isDeleted ? null : msg.replyTo.content,
          sender: toChatUser(msg.replyTo.sender, onlineUserIds?.has(msg.replyTo.senderId)),
        }
      : null,
    isEdited: msg.isEdited,
    isDeleted: msg.isDeleted,
    status: msg.status,
    attachments: msg.attachments.map(toAttachmentDTO),
    reactions: groupReactions(msg.reactions),
    readBy: msg.reads.map((r) => r.userId),
    createdAt: msg.createdAt.toISOString(),
    updatedAt: msg.updatedAt.toISOString(),
  }
}
