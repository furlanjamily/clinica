export const ConversationType = {
  Direct: "Direct",
  Group: "Group",
} as const

export type ConversationTypeValue =
  (typeof ConversationType)[keyof typeof ConversationType]

export const ChatMessageStatus = {
  Sent: "Sent",
  Delivered: "Delivered",
  Read: "Read",
} as const

export type ChatMessageStatusValue =
  (typeof ChatMessageStatus)[keyof typeof ChatMessageStatus]

export const ChatAttachmentType = {
  Image: "Image",
  Video: "Video",
  Pdf: "Pdf",
  Document: "Document",
  Link: "Link",
} as const

export type ChatAttachmentTypeValue =
  (typeof ChatAttachmentType)[keyof typeof ChatAttachmentType]

export type ChatUser = {
  id: string
  name: string | null
  email: string
  image: string | null
  role: string | null
  isOnline?: boolean
  jobTitle?: string | null
}

export type ChatAttachmentDTO = {
  id: number
  fileName: string
  fileUrl: string
  mimeType: string | null
  sizeBytes: number | null
  type: ChatAttachmentTypeValue
  thumbnailUrl: string | null
  createdAt: string
}

export type ChatMessageDTO = {
  id: number
  conversationId: number
  senderId: string
  sender: ChatUser
  content: string | null
  replyToId: number | null
  replyTo: Pick<ChatMessageDTO, "id" | "content" | "sender"> | null
  isEdited: boolean
  isDeleted: boolean
  status: ChatMessageStatusValue
  attachments: ChatAttachmentDTO[]
  reactions: Array<{ emoji: string; userId: string; count: number }>
  readBy: string[]
  createdAt: string
  updatedAt: string
}

export type ConversationParticipantDTO = {
  userId: string
  user: ChatUser
  category: string | null
  isFavorite: boolean
  isMuted: boolean
  isArchived: boolean
  unreadCount: number
  lastReadAt: string | null
}

export type ConversationDTO = {
  id: number
  title: string | null
  type: ConversationTypeValue
  category: string | null
  isFavorite: boolean
  isMuted: boolean
  isArchived: boolean
  unreadCount: number
  lastMessageAt: string | null
  lastMessage: Pick<ChatMessageDTO, "id" | "content" | "senderId" | "createdAt" | "isDeleted"> | null
  participants: ConversationParticipantDTO[]
  otherParticipant: ChatUser | null
  createdAt: string
  updatedAt: string
}

export type MessagesPageDTO = {
  messages: ChatMessageDTO[]
  nextCursor: number | null
  hasMore: boolean
}

export type ConversationSearchResult = {
  conversations: ConversationDTO[]
  categories: string[]
}

export type TypingUser = {
  userId: string
  name: string | null
}

export type UploadResultDTO = {
  fileName: string
  fileUrl: string
  mimeType: string
  sizeBytes: number
  type: ChatAttachmentTypeValue
  thumbnailUrl: string | null
}
