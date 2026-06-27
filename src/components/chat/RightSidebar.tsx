"use client"

import Image from "next/image"
import { ExternalLink, FileText, Film, Link2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatFileSize } from "@/lib/chat/format"
import type { ChatAttachmentDTO } from "@/lib/chat/types"

type Props = {
  attachments: ChatAttachmentDTO[]
  className?: string
}

export function FileCard({ attachment }: { attachment: ChatAttachmentDTO }) {
  return (
    <a
      href={attachment.fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50/50 p-3 transition hover:border-primary/20 hover:bg-primary/[0.03]"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
        <FileText size={18} className="text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-800">{attachment.fileName}</p>
        <p className="text-xs text-secondary">{formatFileSize(attachment.sizeBytes)}</p>
      </div>
      <ExternalLink size={14} className="text-accent" />
    </a>
  )
}

export function VideoCard({ attachment }: { attachment: ChatAttachmentDTO }) {
  return (
    <a
      href={attachment.fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50/50 p-3 transition hover:border-primary/20 hover:bg-primary/[0.03]"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
        <Film size={18} className="text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-800">{attachment.fileName}</p>
        <p className="text-xs text-secondary">{formatFileSize(attachment.sizeBytes)}</p>
      </div>
      <ExternalLink size={14} className="text-accent" />
    </a>
  )
}

export function ImageGallery({ images }: { images: ChatAttachmentDTO[] }) {
  if (images.length === 0) return null
  return (
    <div className="grid grid-cols-2 gap-2">
      {images.slice(0, 4).map((img) => (
        <a
          key={img.id}
          href={img.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative aspect-square overflow-hidden rounded-2xl border border-gray-200 bg-gray-100"
        >
          <Image
            src={img.fileUrl}
            alt={img.fileName}
            fill
            className="object-cover transition hover:scale-105"
            unoptimized
          />
        </a>
      ))}
    </div>
  )
}

export function RightSidebar({ attachments, className }: Props) {
  const videos = attachments.filter((a) => a.type === "Video")
  const images = attachments.filter((a) => a.type === "Image")
  const files = attachments.filter((a) => a.type === "Pdf" || a.type === "Document")
  const links = attachments.filter((a) => a.type === "Link")

  return (
    <aside className={cn("flex h-full w-full flex-col overflow-hidden", className)}>
      <div className="border-b border-gray-100 px-5 py-4">
        <h3 className="text-lg font-semibold text-primary">Arquivos</h3>
        <p className="text-xs text-secondary">Compartilhados nesta conversa</p>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 [-webkit-overflow-scrolling:touch]">
        <Section title="Vídeos" icon={Film} count={videos.length}>
          <div className="space-y-2">
            {videos.map((v) => (
              <VideoCard key={v.id} attachment={v} />
            ))}
          </div>
        </Section>

        <Section title="Imagens" icon={FileText} count={images.length}>
          <ImageGallery images={images} />
        </Section>

        <Section title="Documentos" icon={FileText} count={files.length}>
          <div className="space-y-2">
            {files.map((f) => (
              <FileCard key={f.id} attachment={f} />
            ))}
          </div>
        </Section>

        <Section title="Links" icon={Link2} count={links.length}>
          <div className="space-y-2">
            {links.map((l) => (
              <FileCard key={l.id} attachment={l} />
            ))}
          </div>
        </Section>

        {attachments.length === 0 ? (
          <p className="py-8 text-center text-sm text-secondary">Nenhum arquivo compartilhado</p>
        ) : null}
      </div>
    </aside>
  )
}

function Section({
  title,
  icon: Icon,
  count,
  children,
}: {
  title: string
  icon: typeof FileText
  count: number
  children: React.ReactNode
}) {
  if (count === 0) return null
  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <Icon size={16} className="text-primary" />
        <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
      </div>
      {children}
    </div>
  )
}
