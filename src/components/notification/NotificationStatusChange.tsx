import { ArrowRight, Check, CircleDashed } from "lucide-react";

interface NotificationStatusChangeProps {
  previousStatus: string;
  currentStatus: string;
}

export function NotificationStatusChange({
  previousStatus,
  currentStatus,
}: NotificationStatusChangeProps) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-secondary">
        <CircleDashed size={14} className="shrink-0" aria-hidden="true" />
        {previousStatus}
      </span>

      <ArrowRight
        size={16}
        className="shrink-0 text-primary/40"
        aria-hidden="true"
      />

      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
        <Check size={14} className="shrink-0" aria-hidden="true" />
        {currentStatus}
      </span>
    </div>
  );
}
