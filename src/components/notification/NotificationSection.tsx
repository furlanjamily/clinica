import { NotificationCard } from "./NotificationCard";
import type { NotificationDayGroupDTO } from "@/lib/notification/dto";

interface NotificationSectionProps {
  dayLabel: string;
  notifications: NotificationDayGroupDTO["notifications"];
  onNavigate?: () => void;
  onMarkAsRead?: (notificationId: string) => void;
  isMarkingRead?: boolean;
}

export function NotificationSection({
  dayLabel,
  notifications,
  onNavigate,
  onMarkAsRead,
  isMarkingRead,
}: NotificationSectionProps) {
  if (notifications.length === 0) return null;

  return (
    <section className="mb-8 last:mb-0" aria-labelledby={`section-${dayLabel}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h3
            id={`section-${dayLabel}`}
            className="text-base font-medium text-secondary"
          >
            {dayLabel}
          </h3>
          <span
            className="inline-flex min-w-[22px] items-center justify-center rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary"
            aria-label={`${notifications.length} notificações`}
          >
            {notifications.length}
          </span>
        </div>

        <button
          type="button"
          className="cursor-pointer text-sm font-medium text-primary transition-opacity duration-200 hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white rounded-sm"
        >
          Ver todas
        </button>
      </div>

      <div role="list">
        {notifications.map((notification) => (
          <div key={notification.id} role="listitem">
            <NotificationCard
              notification={notification}
              onNavigate={onNavigate}
              onMarkAsRead={onMarkAsRead}
              isMarkingRead={isMarkingRead}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
