import { X } from "lucide-react";

interface NotificationHeaderProps {
  onClose: () => void;
}

export function NotificationHeader({ onClose }: NotificationHeaderProps) {
  return (
    <header className="flex shrink-0 items-start justify-between gap-4 px-8 pb-6 pt-7">
      <h2 className="text-[30px] font-bold leading-tight text-primary">
        Notificações
      </h2>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar notificações"
        className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <X size={18} />
      </button>
    </header>
  );
}
