"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ModalOverlay } from "@/components/ui/modal-overlay";
import { cn } from "@/lib/utils";
import {
  NOTIFICATION_TAB,
  type NotificationTab,
} from "@/lib/notification/constants";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationFooter } from "./NotificationFooter";
import { NotificationHeader } from "./NotificationHeader";
import { NotificationSection } from "./NotificationSection";
import { NotificationTabs } from "./NotificationTabs";

interface NotificationPopoverProps {
  open: boolean;
  onClose: () => void;
  unreadCount: number;
}

export function NotificationPopover({ open, onClose, unreadCount }: NotificationPopoverProps) {
  const [activeTab, setActiveTab] = useState<NotificationTab>(
    NOTIFICATION_TAB.UNREAD
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    groupedNotifications,
    markAsRead,
    markAllAsRead,
    isMarkingRead,
    isMarkingAllRead,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useNotifications(activeTab, open);

  const handleMarkAsRead = useCallback(
    (notificationId: string) => {
      markAsRead([notificationId]);
    },
    [markAsRead]
  );

  const handleMarkAllAsRead = useCallback(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  const handleScroll = useCallback(() => {
    const element = scrollRef.current;
    if (!element || !hasNextPage || isFetchingNextPage) return;

    const distanceToBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;

    if (distanceToBottom < 120) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <ModalOverlay>
      <div
        className="flex h-full w-full items-center justify-center"
        onClick={onClose}
        role="presentation"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Painel de notificações"
          onClick={(event) => event.stopPropagation()}
          className={cn(
            "flex w-full max-w-[560px] flex-col overflow-hidden bg-white",
            "max-h-[min(760px,92dvh)] sm:max-h-[min(760px,90dvh)]",
            "rounded-[28px] border border-primary/10 shadow-[0_24px_80px_rgba(151,71,255,0.12)]",
            "max-sm:max-h-[92dvh] max-sm:rounded-2xl"
          )}
        >
          <NotificationHeader onClose={onClose} />
          <NotificationTabs activeTab={activeTab} onTabChange={setActiveTab} />

          <div
            ref={scrollRef}
            onScroll={handleScroll}
            id={`notification-panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`notification-tab-${activeTab}`}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-8 pb-6 [scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-sm text-gray-500">Carregando notificações...</p>
              </div>
            ) : groupedNotifications.length > 0 ? (
              <>
                {groupedNotifications.map((group) => (
                  <NotificationSection
                    key={group.dayLabel}
                    dayLabel={group.dayLabel}
                    notifications={group.notifications}
                    onNavigate={onClose}
                    onMarkAsRead={handleMarkAsRead}
                    isMarkingRead={isMarkingRead}
                  />
                ))}
                {isFetchingNextPage ? (
                  <p className="pb-4 text-center text-xs text-gray-400">
                    Carregando mais...
                  </p>
                ) : null}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-sm text-gray-500">
                  Nenhuma notificação encontrada.
                </p>
              </div>
            )}
          </div>

          <NotificationFooter
            onMarkAllAsRead={handleMarkAllAsRead}
            disabled={unreadCount === 0 || isMarkingAllRead}
          />
        </div>
      </div>
    </ModalOverlay>
  );
}
