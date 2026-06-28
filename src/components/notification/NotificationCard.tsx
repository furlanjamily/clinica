"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatTimeAgo } from "@/lib/date/format-time-ago";
import { buildChatConversationHref } from "@/lib/chat/navigation";
import { NOTIFICATION_TYPE } from "@/lib/notification/constants";
import type { NotificationDTO } from "@/lib/notification/dto";
import { NotificationAvatar } from "./NotificationAvatar";

const primaryButtonClassName =
  "rounded-full bg-primary px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50";

const secondaryButtonClassName =
  "rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50";

interface NotificationCardProps {
  notification: NotificationDTO;
  className?: string;
  onNavigate?: () => void;
  onMarkAsRead?: (notificationId: string) => void;
  isMarkingRead?: boolean;
}

export function NotificationCard({
  notification,
  className,
  onNavigate,
  onMarkAsRead,
  isMarkingRead = false,
}: NotificationCardProps) {
  const router = useRouter();
  const timeAgo = formatTimeAgo(notification.createdAt);

  const handleReply = useCallback(() => {
    if (!notification.conversationId) return;
    onNavigate?.();
    router.push(buildChatConversationHref(notification.conversationId));
  }, [notification.conversationId, onNavigate, router]);

  const handleMarkAsRead = useCallback(() => {
    if (!notification.unread) return;
    onMarkAsRead?.(notification.id);
  }, [notification.id, notification.unread, onMarkAsRead]);

  const showDescription =
    (notification.type === NOTIFICATION_TYPE.MESSAGE ||
      notification.type === NOTIFICATION_TYPE.APPOINTMENT ||
      notification.type === NOTIFICATION_TYPE.REMINDER) &&
    notification.description;

  return (
    <article
      className={cn(
        "group mt-4 rounded-[22px] border border-primary/10 bg-primary/[0.03] p-6",
        "transition-all duration-200 ease-out",
        "hover:-translate-y-0.5 hover:border-primary/20 hover:bg-primary/[0.06] hover:shadow-[0_8px_24px_rgba(151,71,255,0.08)]",
        className
      )}
      aria-label={`Notificação de ${notification.actorName}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex w-2 shrink-0 items-center self-center pt-0.5">
          {notification.unread ? (
            <span
              className="h-2 w-2 rounded-full bg-primary"
              aria-label="Não lida"
            />
          ) : (
            <span className="h-2 w-2" aria-hidden="true" />
          )}
        </div>

        <NotificationAvatar
          image={notification.actorAvatar}
          alt={notification.actorName}
        />

        <div className="min-w-0 flex-1">
          <p className="text-[15px] leading-snug text-gray-500">
            <span className="font-semibold text-primary">
              {notification.actorName}
            </span>
            {notification.action ? ` ${notification.action}` : null}
            {notification.entityName ? ` — ${notification.entityName}` : null}
          </p>

          <time
            className="mt-1 block text-xs text-gray-400"
            dateTime={notification.createdAt}
          >
            {timeAgo}
          </time>

          {showDescription && (
            <div className="mt-3 rounded-[14px] bg-primary/[0.06] px-4 py-4">
              <p
                className={cn(
                  "text-sm leading-relaxed text-secondary",
                  notification.type === NOTIFICATION_TYPE.MESSAGE && "italic"
                )}
              >
                {notification.description}
              </p>
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {notification.unread && onMarkAsRead ? (
              <button
                type="button"
                onClick={handleMarkAsRead}
                disabled={isMarkingRead}
                className={secondaryButtonClassName}
              >
                Marcar como lida
              </button>
            ) : null}

            {notification.type === NOTIFICATION_TYPE.MESSAGE &&
            notification.conversationId != null ? (
              <button
                type="button"
                onClick={handleReply}
                className={primaryButtonClassName}
              >
                Responder
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
