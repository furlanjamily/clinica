"use client"

import Image from "next/image"
import { FileText, Film, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatFileSize } from "@/lib/chat/format"
import type { ChatAttachmentDTO } from "@/lib/chat/types"

type Props = {
  attachment: ChatAttachmentDTO
  compact?: boolean
  onRemove?: () => void
}

export function AttachmentPreview({ attachment, compact, onRemove }: Props) {
  if (attachment.type === "Image") {
    return (
      <div className={cn("relative overflow-hidden rounded-xl", compact ? "max-w-xs" : "aspect-video w-full")}>
        <Image
          src={attachment.fileUrl}
          alt={attachment.fileName}
          width={320}
          height={200}
          className="h-auto max-h-48 w-full object-cover"
          unoptimized
        />
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white"
          >
            ×
          </button>
        ) : null}
      </div>
    )
  }

  const Icon = attachment.type === "Video" ? Film : FileText

  return (
    <a
      href={attachment.fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/50 p-3 transition hover:border-primary/20 hover:bg-primary/[0.03]",
        compact ? "max-w-xs" : "w-full"
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">
        <Icon size={18} className="text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-800">{attachment.fileName}</p>
        <p className="text-xs text-secondary">{formatFileSize(attachment.sizeBytes)}</p>
      </div>
      <ExternalLink size={14} className="shrink-0 text-accent" />
    </a>
  )
}
