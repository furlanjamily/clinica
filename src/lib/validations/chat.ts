import { z } from "zod"

const attachmentTypeEnum = z.enum(["Image", "Video", "Pdf", "Document", "Link"])
const messageStatusEnum = z.enum(["Sent", "Delivered", "Read"])

export const CreateConversationSchema = z.object({
  participantIds: z.array(z.string().min(1)).min(1, "Informe ao menos um participante"),
  title: z.string().trim().max(120).optional(),
  type: z.enum(["Direct", "Group"]).optional(),
})

export const UpdateConversationSchema = z.object({
  conversationId: z.number().int().positive(),
  isFavorite: z.boolean().optional(),
  isMuted: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  category: z.string().trim().max(60).nullable().optional(),
})

export const SendMessageSchema = z.object({
  conversationId: z.number().int().positive(),
  content: z.string().trim().max(10000).optional(),
  replyToId: z.number().int().positive().optional(),
  attachmentIds: z.array(z.number().int().positive()).optional(),
  attachments: z
    .array(
      z.object({
        fileName: z.string().min(1),
        fileUrl: z.string().min(1),
        mimeType: z.string().optional(),
        sizeBytes: z.number().int().nonnegative().optional(),
        type: attachmentTypeEnum,
        thumbnailUrl: z.string().nullable().optional(),
      })
    )
    .optional(),
})

export const EditMessageSchema = z.object({
  messageId: z.number().int().positive(),
  content: z.string().trim().min(1).max(10000),
})

export const DeleteMessageSchema = z.object({
  messageId: z.number().int().positive(),
})

export const GetMessagesSchema = z.object({
  conversationId: z.number().int().positive(),
  cursor: z.number().int().positive().optional(),
  limit: z.number().int().min(1).max(100).optional(),
  search: z.string().trim().max(200).optional(),
})

export const MarkReadSchema = z.object({
  conversationId: z.number().int().positive(),
  messageIds: z.array(z.number().int().positive()).optional(),
})

export const TypingSchema = z.object({
  conversationId: z.number().int().positive(),
  isTyping: z.boolean(),
})

export const ConversationSearchSchema = z.object({
  q: z.string().trim().max(200).optional(),
  archived: z.boolean().optional(),
})

export const UpdateMessageStatusSchema = z.object({
  messageId: z.number().int().positive(),
  status: messageStatusEnum,
})
