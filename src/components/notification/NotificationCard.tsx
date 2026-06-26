import { cn } from "@/lib/utils";
import {
  NOTIFICATION_TYPE,
  formatTimeAgo,
  parseNotificationTitle,
  type Notification,
} from "./types";
import { NotificationAvatar } from "./NotificationAvatar";
import { NotificationComment } from "./NotificationComment";
import { NotificationStatusChange } from "./NotificationStatusChange";

interface NotificationCardProps {
  notification: Notification;
  className?: string;
}

export function NotificationCard({
  notification,
  className,
}: NotificationCardProps) {
  const { personName, action } = parseNotificationTitle(notification.title);
  const timeAgo = formatTimeAgo(notification.createdAt);

  return (
    <article
      className={cn(
        "group mt-4 rounded-[22px] border border-primary/10 bg-primary/[0.03] p-6",
        "transition-all duration-200 ease-out",
        "hover:-translate-y-0.5 hover:border-primary/20 hover:bg-primary/[0.06] hover:shadow-[0_8px_24px_rgba(151,71,255,0.08)]",
        className
      )}
      aria-label={`Notificação de ${personName}`}
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

        <NotificationAvatar src={notification.avatar} alt={personName} />

        <div className="min-w-0 flex-1">
          <p className="text-[15px] leading-snug text-gray-500">
            <span className="font-semibold text-primary">{personName}</span>
            {action ? ` ${action}` : null}
          </p>

          <time
            className="mt-1 block text-xs text-gray-400"
            dateTime={notification.createdAt}
          >
            {timeAgo}
          </time>

          {notification.type === NOTIFICATION_TYPE.REMINDER && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                Ignorar
              </button>
              <button
                type="button"
                className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                Responder
              </button>
            </div>
          )}

          {notification.type === NOTIFICATION_TYPE.STATUS_CHANGED &&
            notification.previousStatus &&
            notification.currentStatus && (
              <NotificationStatusChange
                previousStatus={notification.previousStatus}
                currentStatus={notification.currentStatus}
              />
            )}

          {notification.type === NOTIFICATION_TYPE.COMMENT &&
            notification.comment && (
              <NotificationComment comment={notification.comment} />
            )}
        </div>
      </div>
    </article>
  );
}
