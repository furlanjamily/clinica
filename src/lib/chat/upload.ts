import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { ValidationError } from "@/lib/errors/custom-errors"
import { ChatAttachmentType, type ChatAttachmentTypeValue } from "./types"

const MAX_FILE_SIZE = 25 * 1024 * 1024
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "chat")

const MIME_MAP: Record<string, ChatAttachmentTypeValue> = {
  "image/jpeg": ChatAttachmentType.Image,
  "image/png": ChatAttachmentType.Image,
  "image/gif": ChatAttachmentType.Image,
  "image/webp": ChatAttachmentType.Image,
  "video/mp4": ChatAttachmentType.Video,
  "video/webm": ChatAttachmentType.Video,
  "application/pdf": ChatAttachmentType.Pdf,
  "application/msword": ChatAttachmentType.Document,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    ChatAttachmentType.Document,
  "text/plain": ChatAttachmentType.Document,
}

export function resolveAttachmentType(mimeType: string): ChatAttachmentTypeValue {
  return MIME_MAP[mimeType] ?? ChatAttachmentType.Document
}

export async function saveChatUpload(file: File): Promise<{
  fileName: string
  fileUrl: string
  mimeType: string
  sizeBytes: number
  type: ChatAttachmentTypeValue
  thumbnailUrl: string | null
}> {
  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError("Arquivo excede o limite de 25 MB.")
  }

  const mimeType = file.type || "application/octet-stream"
  const type = resolveAttachmentType(mimeType)
  const ext = path.extname(file.name) || ".bin"
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`

  await mkdir(UPLOAD_DIR, { recursive: true })

  const buffer = Buffer.from(await file.arrayBuffer())
  const diskPath = path.join(UPLOAD_DIR, safeName)
  await writeFile(diskPath, buffer)

  const fileUrl = `/uploads/chat/${safeName}`
  const thumbnailUrl = type === ChatAttachmentType.Image ? fileUrl : null

  return {
    fileName: file.name,
    fileUrl,
    mimeType,
    sizeBytes: file.size,
    type,
    thumbnailUrl,
  }
}
