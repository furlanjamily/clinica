import { MessageSquare } from "lucide-react";

interface NotificationFooterProps {
  onMarkAllAsRead: () => void;
  disabled?: boolean;
}

export function NotificationFooter({
  onMarkAllAsRead,
  disabled = false,
}: NotificationFooterProps) {
  return (
    <footer className="shrink-0 border-t border-primary/10 bg-white">
      <button
        type="button"
        onClick={onMarkAllAsRead}
        disabled={disabled}
        className="flex h-16 w-full items-center justify-center gap-2 text-sm text-gray-500 transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Marcar todas as notificações como lidas"
      >
        <MessageSquare size={16} aria-hidden="true" />
        Marcar todas como lidas
      </button>
    </footer>
  );
}
