"use client"

import { useEffect, useRef, useState, type ChangeEvent } from "react"
import { Camera, Loader2, Trash2 } from "lucide-react"
import { Avatar } from "@/components/common/Avatar"
import { Button } from "@/components/ui/button"
import {
  AVATAR_ACCEPTED_INPUT,
  MAX_AVATAR_SIZE_BYTES,
  MAX_AVATAR_SIZE_MB,
} from "@/lib/upload/avatar-config"
import { cn } from "@/lib/utils"

const ACCEPTED_IMAGE_TYPES = AVATAR_ACCEPTED_INPUT

type ProfileImageUploadProps = {
  name?: string
  imageUrl?: string | null
  onFileSelected: (file: File) => void
  onRemove: () => void
  isUploading?: boolean
  disabled?: boolean
  className?: string
}

function validateImageFile(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "Formato inválido. Use JPEG, PNG, WebP ou GIF."
  }
  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    return `A imagem deve ter no máximo ${MAX_AVATAR_SIZE_MB} MB.`
  }
  return null
}

export function ProfileImageUpload({
  name,
  imageUrl,
  onFileSelected,
  onRemove,
  isUploading = false,
  disabled = false,
  className,
}: ProfileImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    const validationError = validateImageFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(URL.createObjectURL(file))
    onFileSelected(file)
  }

  function handleRemove() {
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setError(null)
    onRemove()
  }

  const displayImage = previewUrl ?? imageUrl ?? null

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Foto de perfil</p>
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative">
          <Avatar name={name} image={displayImage} size={72} />
          {isUploading ? (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES}
            className="hidden"
            disabled={disabled || isUploading}
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || isUploading}
            onClick={() => inputRef.current?.click()}
          >
            <Camera size={14} />
            {displayImage ? "Substituir foto" : "Enviar foto"}
          </Button>
          {displayImage ? (
            <Button
              type="button"
              variant="ghost-danger"
              size="sm"
              disabled={disabled || isUploading}
              onClick={handleRemove}
            >
              <Trash2 size={14} />
              Remover foto
            </Button>
          ) : null}
        </div>
      </div>
      <p className="text-xs text-gray-400">
        JPEG, PNG, WebP ou GIF — máximo {MAX_AVATAR_SIZE_MB} MB.
      </p>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  )
}
