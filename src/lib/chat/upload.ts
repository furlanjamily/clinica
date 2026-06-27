import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { put } from "@vercel/blob"
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

function buildSafeFileName(originalName: string): string {
  const ext = path.extname(originalName) || ".bin"
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`
}

function buildUploadResult(
  file: File,
  fileUrl: string,
  mimeType: string,
  type: ChatAttachmentTypeValue
) {
  return {
    fileName: file.name,
    fileUrl,
    mimeType,
    sizeBytes: file.size,
    type,
    thumbnailUrl: type === ChatAttachmentType.Image ? fileUrl : null,
  }
}

async function saveToLocalDisk(
  file: File,
  safeName: string,
  buffer: Buffer,
  mimeType: string,
  type: ChatAttachmentTypeValue
) {
  await mkdir(UPLOAD_DIR, { recursive: true })
  await writeFile(path.join(UPLOAD_DIR, safeName), buffer)
  return buildUploadResult(file, `/uploads/chat/${safeName}`, mimeType, type)
}

async function saveToVercelBlob(
  file: File,
  safeName: string,
  buffer: Buffer,
  mimeType: string,
  type: ChatAttachmentTypeValue
) {
  const blob = await put(`chat/${safeName}`, buffer, {
    access: "public",
    contentType: mimeType,
    addRandomSuffix: false,
  })
  return buildUploadResult(file, blob.url, mimeType, type)
}

function shouldUseVercelBlob(): boolean {
  return (
    process.env.VERCEL === "1" ||
    Boolean(process.env.BLOB_READ_WRITE_TOKEN) ||
    Boolean(process.env.BLOB_STORE_ID)
  )
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
  const safeName = buildSafeFileName(file.name)
  const buffer = Buffer.from(await file.arrayBuffer())

  if (shouldUseVercelBlob()) {
    try {
      return await saveToVercelBlob(file, safeName, buffer, mimeType, type)
    } catch (error) {
      if (process.env.VERCEL === "1") {
        const detail = error instanceof Error ? error.message : "erro desconhecido"
        throw new ValidationError(
          `Falha no upload para Vercel Blob: ${detail}. Verifique se o store está conectado ao projeto e redeploye.`
        )
      }
      throw error
    }
  }

  return saveToLocalDisk(file, safeName, buffer, mimeType, type)
}
