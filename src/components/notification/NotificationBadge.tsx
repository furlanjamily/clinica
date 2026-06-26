import { cn } from "@/lib/utils";

interface NotificationBadgeProps {
  count: number;
  className?: string;
}

export function NotificationBadge({ count, className }: NotificationBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-w-[22px] items-center justify-center rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary",
        className
      )}
      aria-label={`${count} notificações`}
    >
      {count}
    </span>
  );
}
