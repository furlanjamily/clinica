import { NotificationBadge } from "./NotificationBadge";
import { NotificationCard } from "./NotificationCard";
import type { DayLabel, Notification } from "./types";

interface NotificationSectionProps {
  dayLabel: DayLabel;
  notifications: Notification[];
}

export function NotificationSection({
  dayLabel,
  notifications,
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
          <NotificationBadge count={notifications.length} />
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
            <NotificationCard notification={notification} />
          </div>
        ))}
      </div>
    </section>
  );
}
