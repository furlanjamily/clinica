"use client"

import { cn } from "@/lib/utils"
import type { ChatMessageDTO } from "@/lib/chat/types"
import { shouldShowDaySeparator, formatDaySeparator } from "@/lib/chat/format"
import { MessageAvatar } from "./MessageAvatar"
import { MessageTime } from "./MessageTime"
import { MessageStatus } from "./MessageStatus"
import { AttachmentPreview } from "./AttachmentPreview"

type Props = {
  message: ChatMessageDTO
  previousMessage: ChatMessageDTO | null
  currentUserId: string
  onReply?: (message: ChatMessageDTO) => void
  onEdit?: (message: ChatMessageDTO) => void
  onDelete?: (messageId: number) => void
}

export function MessageBubble({
  message,
  previousMessage,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
}: Props) {
  const isOwn = message.senderId === currentUserId
  const showDay = shouldShowDaySeparator(message.createdAt, previousMessage?.createdAt ?? null)
  const isGrouped =
    previousMessage &&
    previousMessage.senderId === message.senderId &&
    !showDay &&
    new Date(message.createdAt).getTime() - new Date(previousMessage.createdAt).getTime() < 120_000

  if (message.isDeleted) {
    return (
      <>
        {showDay ? <DaySeparator date={message.createdAt} /> : null}
        <div className="flex justify-center py-1">
          <p className="text-xs italic text-secondary">Mensagem excluída</p>
        </div>
      </>
    )
  }

  return (
    <>
      {showDay ? <DaySeparator date={message.createdAt} /> : null}
      <div
        className={cn(
          "group flex w-full gap-2.5 px-2 py-0.5",
          isOwn ? "justify-end" : "justify-start"
        )}
      >
        {!isOwn && !isGrouped ? (
          <MessageAvatar
            name={message.sender.name}
            image={message.sender.image}
            size="sm"
            className="mt-1"
          />
        ) : !isOwn ? (
          <div className="w-8 shrink-0" />
        ) : null}

        <div
          className={cn(
            "relative max-w-[min(520px,75%)] rounded-2xl px-4 py-2.5 shadow-sm transition-shadow group-hover:shadow-md",
            isOwn
              ? "rounded-br-md bg-primary/[0.06] text-gray-800"
              : "rounded-bl-md border border-gray-200 bg-white text-gray-800"
          )}
        >
          {!isGrouped ? (
            <div className="mb-1 flex items-center gap-2">
              {!isOwn ? (
                <span className="text-xs font-semibold text-gray-900">
                  {message.sender.name}
                </span>
              ) : null}
              <MessageTime time={message.createdAt} />
              {message.isEdited ? (
                <span className="text-[10px] text-accent">editada</span>
              ) : null}
            </div>
          ) : null}

          {message.replyTo ? (
            <div className="mb-2 rounded-xl border-l-2 border-primary/50 bg-primary/[0.04] px-3 py-2 text-xs text-secondary">
              <span className="font-medium text-gray-700">
                Resposta de {message.replyTo.sender.name}
              </span>
              <p className="mt-0.5 line-clamp-2">{message.replyTo.content}</p>
            </div>
          ) : null}

          {message.content ? (
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
              {renderContent(message.content)}
            </p>
          ) : null}

          {message.attachments.length > 0 ? (
            <div className="mt-2 space-y-2">
              {message.attachments.map((a) => (
                <AttachmentPreview key={a.id} attachment={a} compact />
              ))}
            </div>
          ) : null}

          {isOwn ? (
            <div className="mt-1 flex items-center justify-end gap-1">
              <MessageStatus
                status={message.status}
                isOwn={isOwn}
                readByOthers={message.readBy.some((id) => id !== currentUserId)}
              />
            </div>
          ) : null}

          <div className="absolute -top-3 right-2 hidden gap-1 rounded-lg bg-white px-1 py-0.5 shadow group-hover:flex">
            {onReply ? (
              <ActionBtn label="Responder" onClick={() => onReply(message)} />
            ) : null}
            {isOwn && onEdit ? (
              <ActionBtn label="Editar" onClick={() => onEdit(message)} />
            ) : null}
            {isOwn && onDelete ? (
              <ActionBtn label="Excluir" onClick={() => onDelete(message.id)} />
            ) : null}
          </div>
        </div>
      </div>
    </>
  )
}

function DaySeparator({ date }: { date: string }) {
  return (
    <div className="relative my-4 flex items-center justify-center">
      <div className="absolute inset-x-8 top-1/2 h-px bg-gray-200" />
      <span className="relative rounded-full border border-gray-200 bg-white px-4 py-1 text-[11px] font-medium text-secondary shadow-sm">
        {formatDaySeparator(date)}
      </span>
    </div>
  )
}

function ActionBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded px-2 py-0.5 text-[10px] font-medium text-secondary hover:bg-primary/5 hover:text-primary"
    >
      {label}
    </button>
  )
}

function renderContent(text: string) {
  const parts = text.split(/(@\w+|https?:\/\/\S+)/g)
  return parts.map((part, i) => {
    if (part.startsWith("@") || part.startsWith("http")) {
      return (
        <span key={i} className="font-medium text-primary">
          {part}
        </span>
      )
    }
    return part
  })
}
