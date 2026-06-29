import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { put } from "@vercel/blob"
import { ValidationError } from "@/lib/errors/custom-errors"
import logger from "@/lib/logging/logger"
import { MAX_AVATAR_SIZE_BYTES, MAX_AVATAR_SIZE_MB } from "./avatar-config"
import type { AvatarUploadResultDTO } from "./types"

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "avatars")

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])

function buildSafeFileName(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase() || ".jpg"
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`
}

function shouldUseVercelBlob(): boolean {
  return (
    process.env.VERCEL === "1" ||
    Boolean(process.env.BLOB_READ_WRITE_TOKEN) ||
    Boolean(process.env.BLOB_STORE_ID)
  )
}

async function saveToLocalDisk(safeName: string, buffer: Buffer, mimeType: string): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true })
  await writeFile(path.join(UPLOAD_DIR, safeName), buffer)
  return `/uploads/avatars/${safeName}`
}

async function saveToVercelBlob(safeName: string, buffer: Buffer, mimeType: string): Promise<string> {
  const blob = await put(`avatars/${safeName}`, buffer, {
    access: "public",
    contentType: mimeType,
    addRandomSuffix: false,
  })
  return blob.url
}

export async function saveAvatarUpload(file: File): Promise<AvatarUploadResultDTO> {
  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    throw new ValidationError(`A imagem deve ter no máximo ${MAX_AVATAR_SIZE_MB} MB.`)
  }

  const mimeType = file.type || "application/octet-stream"
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new ValidationError("Formato inválido. Use JPEG, PNG, WebP ou GIF.")
  }

  const safeName = buildSafeFileName(file.name)
  const buffer = Buffer.from(await file.arrayBuffer())

  let fileUrl: string
  if (shouldUseVercelBlob()) {
    try {
      fileUrl = await saveToVercelBlob(safeName, buffer, mimeType)
    } catch (error) {
      if (process.env.VERCEL === "1") {
        const detail = error instanceof Error ? error.message : "erro desconhecido"
        throw new ValidationError(
          `Falha no upload para Vercel Blob: ${detail}. Verifique se o store está conectado ao projeto e redeploye.`
        )
      }
      throw error
    }
  } else {
    fileUrl = await saveToLocalDisk(safeName, buffer, mimeType)
  }

  logger.info("Avatar upload concluído", { fileUrl, sizeBytes: file.size })

  return { fileUrl, image: fileUrl }
}
